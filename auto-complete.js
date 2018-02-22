;(function($) {

    function AutoCompletePlugin(element, options) {

        this.options =      null;
        this.$element =     null;
        this.$listElement = null;
        this.sourceArray =  null;
        this.subsetArray =  null;
        this.query =        null;
        this.selectedObj =  null;

        //initialize
        this._init(element, options);        

        var that = this;

        //keyup on input
        this.$element.on('keyup', function(e){
            that._keyup(e);
        });

        //click on selection
        this.$listElement.on('click','div',function(){
            that._click(this);
        });

    };



    


    AutoCompletePlugin.DEFAULTS = {
        source: null,
        sourceComparitor: 0,
        sourceDisplay: 0,
        container: null,
        minChars: 3,
        onKeyup: function(){},
        onSelect: function(){}
    };

    /*AutoCompletePlugin.CONTAINER_CSS = {
        "display":"none",
        "position":"absolute",
        "left":0,
        "top":0,
        "max-height":"100px",
        "overflow-y":"scroll",
        "width": this.$element.width(),
        "background-color":"whitesmoke",
        "cursor":"pointer"
    };*/



    /*
        _init
        @params:
            element: element plugin is attatched to
            options: obj defining user-specified options
    */
    AutoCompletePlugin.prototype._init = function(element, options){
        this.$element = $(element);
        this.options  = $.extend({},this.getDefaults(), options);
        this.retrieveSource();
        this._createList();
    }

    /*

    */
    AutoCompletePlugin.prototype.getDefaults = function() {
        return AutoCompletePlugin.DEFAULTS;
    }

    /*

    */
    AutoCompletePlugin.prototype.retrieveSource = function(){

        var source = this.options.source;

        if( typeof source === 'function' ){
            this.sourceArray = source.call();
        }else
        if( $.isArray(source) ){
            this.sourceArray = source;
        }
        this.subsetArray = this.sourceArray;
    }

    /*
    
    */
    AutoCompletePlugin.prototype._createList = function(){
        this.$listElement = 
            $('<div>Blah</div>')
                .addClass('AutoComplete-container');

        var $container = 
            this.options.container === null || this.options.container === "" ? 
                this.$element.parent() : $(this.options.container);

        if( $container.css("position") === "static" ){
            $container.css({"position":"relatice"});
        }

        this.$listElement .appendTo($container);

        this._positionList();
    }

    /*

    */
    AutoCompletePlugin.prototype._positionList = function(){
        var pos =   this.$element.position();
        var left =  pos.left;
        var top =   pos.top + this.$element.innerHeight();

        var css = {
            "left":left,
            "top":top,
            "width": this.$element.width()
        }

        this.$listElement.css(css);        
    }


    /*

    */
    AutoCompletePlugin.prototype.show = function() {
        this.$listElement.css({"display":"block"});
    }

    /*

    */
    AutoCompletePlugin.prototype.hide = function() {
        this.$listElement.css({"display":"none"});
    }

    /*

    */
    AutoCompletePlugin.prototype._keyup = function(e){
        this.query = this.$element.val();

        var len = this.query.length;

        if( len ){
            //on backspace(8) or delete(46)
            if( e.which === 8 || e.which === 46){
                this._filter(false);
            }else{
                this._filter(true);
            }    
            this.show();
        }else{
            this.hide();
        }  
    }

    /*

    */
    AutoCompletePlugin.prototype._filter = function(fromSubset){
        var set = fromSubset === true ? this.subsetArray : this.sourceArray;
        var that = this;

        this.subsetArray = 
            $.grep(set, function (obj, index) {
                if( obj[that.options.sourceComparitor].substr(0, that.query.length) === that.query )
                    return obj
            });

        this._displayFiltered();
    }

    /*

    */
    AutoCompletePlugin.prototype._displayFiltered = function(){
        this.$listElement.empty();
        var that = this;
        $.each(this.subsetArray,function(index, obj){

            var $option = $('<div>'+obj[that.options.sourceDisplay]+'</div>');
            $option.data(obj);
            that.$listElement.append($option);
        });
    }

    /*

    */
    AutoCompletePlugin.prototype._click = function(list_option){
        this.selectedObj = $(list_option).data();
        this.$element.val( this.selectedObj[this.options.sourceDisplay] );
        this.hide();
    }

    /*

    */
    AutoCompletePlugin.prototype._clearList = function(){
        this.$listElement.empty();        
    }

    /*

    */
    AutoCompletePlugin.prototype.clear = function(){
        this.$element.val("");
        this.selectedObj = null;
        this.subsetArray = this.sourceArray;
        this._clearList();
        this.hide();
    }    

    /*

    */
    AutoCompletePlugin.prototype.value = function(){
        return this.selectedObj;
    }



    /*
        autoComplete
        @params:
            options: obj defining user-specified options
    */
    $.fn.autoComplete = function (options) {

        var instance = $(this).data('AutoCompletePlugin');

        //create plugin if object passed & not intialized
        if( typeof options === 'object' ){

            //if instance does not exist, create
            //otherwise, fall-through and return already initialized plugin
            if(instance === undefined){
                instance = new AutoCompletePlugin($(this),options);
                $(this).data('AutoCompletePlugin', instance);       
            }            
        }
        else
        //call plugin methods if string passed
        if( typeof options === 'string'){

            //no plugin instance
            if(instance === undefined){
                return;
            }

            //call plugin function
            return instance[options].apply(instance);   
        }
        //no plugin instnace found
        else if(instance === undefined){
            return;
        }

        //always return instance
        return instance;
    }

}(jQuery));