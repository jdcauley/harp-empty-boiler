
(function($){
	var cardinal = {
		apiURL: 'https://www.ourstate.com/cardinal/wp-json',
		namespace: '/cardinal/v1',
		wp: '/wp/v2',
		data: {},
		first: null,
		inView: function(element){
			this.el = element;
			this.stateInView;
			this.inView;
			this.outView;

			(this.getBoundingRect = function() {
				var windowTop = window.scrollY;
				var windowBottom = windowTop + window.innerHeight;

				this.box = element.getBoundingClientRect();
				this.boxTop = this.box.top + windowTop;
				this.boxBottom = this.box.bottom + windowTop;
			}).bind(this);
			(this.isInView = function() {
				var windowTop = window.scrollY;
				var windowBottom = windowTop + window.innerHeight;
				var inView = (windowTop < this.boxBottom) && (windowBottom > this.boxTop);

				return inView;
			}).bind(this);
			(this.detectInView = function() {
				var isInView = this.isInView();
				if(isInView && (!this.stateInView || typeof this.stateInView === 'undefined')) {
					this.stateInView = true;
					this.inView&&this.inView();
				}
				else if(!isInView && (this.stateInView || typeof this.stateInView === 'undefined')) {
					this.stateInView = false;
					this.outView&&this.outView();
				}
			}).bind(this);

			// Set In View Functions
			(this.onInView = function(func) {
				this.inView = (function() {
					func.call(this);
				}).bind(this);
				this.detectInView();
			}).bind(this);
			(this.onOutView = function(func) {
				this.outView = (function() {
					func.call(this);
				}).bind(this);
				this.detectInView();
			}).bind(this);

			// init
			this.getBoundingRect();
			this.detectInView();

			window.addEventListener('scroll', function() {
				this.detectInView();
			}.bind(this));

			window.addEventListener('resize', function() {
				this.getBoundingRect();
			}.bind(this));
		},
		recordImpression: function(data){
			var impression = $.ajax({
		  	url: cardinal.apiURL + cardinal.namespace + '/impression',
		  	method: "POST",
		  	data: data
			});

			impression.done(function(data){

			});
		},
		recordClick: function(data){
			var req = $.ajax({
		  	url: cardinal.apiURL + cardinal.namespace + '/click',
		  	method: "POST",
		  	data: data,
			});
		},
		unitClick: function(event){
			event.preventDefault();
			cardinal.recordClick({
				id: this.getAttribute('data-ad'),
				display_url: window.location.href,
				campaign: this.getAttribute('data-campaign')
			});

			var url = this.href;
			window.open(url,'_blank');
		},
		unitView: function(element){
			cardinal.recordImpression({
				id: element.getAttribute('data-ad'),
				display_url: window.location.href,
				campaign: element.getAttribute('data-campaign')
			});
		},
		track: function(element, title){

			var slug = element.href,
					site = window.location.href;

			slugSplit = slug.split('/')[2];
			siteSplit = site.split('/')[2];

			var req = $.ajax({
		  	url: cardinal.apiURL + cardinal.namespace + '/track',
				cache: false,
		  	data: {
					slug: slugSplit + '_' + siteSplit,
					title: title,
					site: site,
					target_url: slug,
				},
				method: 'GET',
				dataType: 'json',
			});

			req.done(function(data){

				element.setAttribute('data-ad', data.id);
				element.addEventListener('click', cardinal.unitClick, false);

				var el = new cardinal.inView(element);
				el.onInView(function() {
						cardinal.unitView(this.el);
				});

			});

		},
		populateCampaign: function(element, id){
			var link = document.createElement('a'),
					img = document.createElement('img'),
					request = $.ajax({
						url: cardinal.apiURL + cardinal.wp + '/campaigns/' + id,
						cache: false,
						method: 'GET',
						dataType: 'json'
					});
			request.done(function( response ) {
				var unit = response.units;

				link.href= unit.target_url;
				link.className = 'cardinal-ad-unit';
				link.setAttribute('data-ad', unit.id);
				link.setAttribute('target', '_blank');
				link.addEventListener('click', cardinal.unitClick, false);

				img.src = unit.featured_image_urls.full_size;
				link.appendChild(img);
				element.appendChild(link);

				var el = new cardinal.inView(link);
			  el.onInView(function() {
						cardinal.unitView(this.el);
			  });

			});
		},
		populateUnit: function(element, i){

			var num = 0,
					unit = null;

			if(cardinal.data[i]){
				num = i;
			}

			if((num === 0) && cardinal.first){

				unit = first;

				link.href= unit.unit_data.target_url;
				link.className = 'cardinal-ad-unit';
				link.setAttribute('data-ad', unit.id);
				link.setAttribute('data-campaign', unit.campaigns[0]);
				link.addEventListener('click', cardinal.unitClick, false);

				img.src = unit.featured_image_urls.full_size;

				link.appendChild(img);
				link.unitData = unit;
				element.appendChild(link);

				var el = new cardinal.inView(link);
			  el.onInView(function() {
						cardinal.unitView(this.el);
			  });
				return;
			}

			var link = document.createElement('a'),
					img = document.createElement('img'),
					request = $.ajax({
						url: cardinal.apiURL + cardinal.wp + '/units/' + cardinal.data[num].ID,
						cache: false,
						method: 'GET',
						dataType: 'json'
					});


			request.done(function( response ) {
				unit = response;

				if(num === 0){
					cardinal.first = unit;
				}

				link.href= unit.unit_data.target_url;
				link.className = 'cardinal-ad-unit';
				link.setAttribute('data-ad', unit.id);
				link.setAttribute('data-campaign', unit.campaigns[0]);
				link.addEventListener('click', cardinal.unitClick, false);

				img.src = unit.featured_image_urls.full_size;

				link.appendChild(img);
				element.appendChild(link);

				if(i === 0){
					cardinal.unitView(link);
				}


				var el = new cardinal.inView(link);
			  el.onInView(function() {
						cardinal.unitView(this.el);
			  });
				return;

			});
		},
		populateUnits: function(element){

			var campaignID = element.getAttribute('data-ad');
			if(campaignID){
				cardinal.populateCampaign(element, campaignID);
			} else {
				cardinal.populateUnit(element);
			}
			return;
		},
		addStyles: function(){
			var css = '.cardinal-ad-unit{display: block;} .cardinal-ad-unit img{display: block; height: auto; max-width: 100%; margin-left: auto; margin-right: auto;}',
				head = document.head || document.getElementsByTagName('head')[0],
      	style = document.createElement('style');

			style.type = 'text/css';
  		if (style.styleSheet){
    		style.styleSheet.cssText = css;
  		} else {
    		style.appendChild(document.createTextNode(css));
  		}
  		head.appendChild(style);
		},
		getUnits: function(){
			cardinal.addStyles();
			var units = document.getElementsByClassName('cardinal');

			var request = $.ajax({
				url: cardinal.apiURL + cardinal.namespace + '/campaign/',
				cache: false,
				method: 'GET',
				dataType: 'json'
			});

			request.done(function( response ) {

				cardinal.data = response;

				for(var i = 0, x = units.length; i < x; i++){
					cardinal.populateUnit(units[i], i);
				};

			});


		},
	};
	cardinal.getUnits();

})(jQuery);
