
(function($){
	var cardinal = {
		apiURL: 'http://local.wordpress.dev/wp-json',
		namespace: '/cardinal/v1',
		wp: '/wp/v2',
		inView: function(element){
			this.el = element; // DOM node - element
			this.stateInView; // bool - is in view
			this.inView; // func - in callback
			this.outView; // func - out callback

			// get and set position vars
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
			$.ajax({
		  	url: cardinal.apiURL + cardinal.namespace + '/impression',
		  	method: "POST",
		  	data: data,
		  	dataType: "json"
			});
		},
		recordClick: function(data){
			var req = $.ajax({
		  	url: cardinal.apiURL + cardinal.namespace + '/click',
		  	method: "POST",
		  	data: data,
		  	dataType: "json"
			});
		},
		unitClick: function(event){
			event.preventDefault();
			cardinal.recordClick({id: this.getAttribute('data-ad')});
			window.location.href = this.href;
		},
		unitView: function(element){
			cardinal.recordImpression({id: element.getAttribute('data-ad')});
		},
		track: function(id, element){

			element.setAttribute('data-ad', id);
			element.addEventListener('click', cardinal.unitClick, false);

			var el = new cardinal.inView(element);
			el.onInView(function() {
					cardinal.unitView(this.el);
			});
		},
		populateCampaign(element, id){
			var link = document.createElement('a'),
					img = document.createElement('img'),
					request = $.ajax({
						url: cardinal.apiURL + cardinal.wp + '/campaigns/' + id,
						method: "GET",
						dataType: "json"
					});
			request.done(function( response ) {
				var unit = response.units;

				link.href= unit.target_url;
				link.className = 'cardinal-ad-unit';
				link.setAttribute('data-ad', unit.id);
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
		populateUnit(element){
			var link = document.createElement('a'),
					img = document.createElement('img'),
					request = $.ajax({
						url: cardinal.apiURL + cardinal.namespace + '/unit',
						method: "GET",
						dataType: "json"
					});

			request.done(function( response ) {
				var unit = response;

				link.href= unit.target_url;
				link.className = 'cardinal-ad-unit';
				link.setAttribute('data-ad', unit.id);
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
			var css = '.cardinal-ad-unit{display: block;} .cardinal-ad-unit img{display: block; height: auto; max-width: 100%;}',
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
			var units = document.getElementsByClassName('ad-unit');
			for(var i = 0, x = units.length; i < x; i++){
				cardinal.populateUnits(units[i]);
			};

		},
	};
	cardinal.getUnits();

	// use id and js element to track custom ids
	// cardinal.track('5', document.getElementById('custom'));

})(jReq);
