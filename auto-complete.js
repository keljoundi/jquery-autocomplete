


/*
    TODO:
        - styling
        - implement container option
        - multi-level property options. i.e. sourceDisplay = name->first
        - destroy() function
        - sorting expects string, determine datatype and sort accordingly
        - auto-select if user types in complete selection (don't force mouse click)
        - keyboard arrow navigation
        - update source after initialized
        - check for function calls before loop! no return possible otherwise!
        - remove sourceDisplay, use comparitor by default if no displayText fn
*/
;(function($) {

    function AutoCompletePlugin(element, options) {

        this.options =      null;
        this.$element =     null;
        this.$listElement = null;
        this.sourceArray =  null;
        this.subsetArray =  null;
        this.selectedObj =  null;

        //initialize
        this._init(element, options);

        var that = this;

        //keyup on input
        this.$element.on('keyup', function(e){
            that._keyup(e);
        });

        //click on selection
        this.$listElement.on('click','div',function(e){
            that._select(this);
        });

        //close menu on document click
        $(document).click(function() {
            that.hide();
        });

    };


    AutoCompletePlugin.DEFAULTS = {
        source: null,
        sourceDisplay: null,
        sourceComparitor: null,//sourceDisplay
        sortOn: null,
        container: null,//parent
        minChars: 3,
        caseSensitive: false,
        onKeyup: null,//function(e){},
        onSelect: null,//function(element,obj){},
        onDeselect: null,//function(element){}
        displayText: null//function(obj){return string;}
    };
    /*
        onKeyup
            @param {object} : js click-event object

        onSelect
            @param {object} : jquery input object
            @param {object} : corrisponding object selected by user from list

        onDeselct
            @param {object} : jquery input object

        displayText
            @desc: user-defined fn to allow for "fancy" text-display such as
                mulitple obj elements or pre/appened texts
            @param {object} : object found through filtering
            @return {string}: string to display in dropdown
    */

    AutoCompletePlugin.prototype.KEYCODES = {
        backspace: 8,
        delete: 46,
        down: 40,
        up: 38,
        enter: 13
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
            @desc: initial setup, define input element, set options,
                retrieve source, initialize DOM elements
            @param {object} element: element plugin is attatched to
            @param {object} options: user-specified options/settings
    */
    AutoCompletePlugin.prototype._init = function(element,options){
        this.$element = $(element);
        this._buildOptions(options);
        this.retrieveSource();
        this._createList();
    }


    /*
        getDefaults
            @desc: get default options
            @return {object}: default options
    */
    AutoCompletePlugin.prototype.getDefaults = function() {
        return AutoCompletePlugin.DEFAULTS;
    }


    /*
        buildOptions
            @desc: add defaults and set options for plugin if not defined by user
            @param {options} options: user-specified options/settings
    */
    AutoCompletePlugin.prototype._buildOptions = function(options) {
        this.options  = $.extend({},this.getDefaults(), options);

        if( this.options.sourceComparitor === null || this.options.sourceComparitor === "" )
            this.options.sourceComparitor = this.options.sourceDisplay;
    }


    /*
        _parseDisplayString
            @desc: extract bracket-enclosed texts to use as object
    */


    /*
        retrieveSource
            @desc: set source & subset arrays, call user-defined function if available
    */
    AutoCompletePlugin.prototype.retrieveSource = function(){

        var source = this.options.source;

        if( typeof source === 'function' ){
            this.sourceArray = source.call();
        }else
        if( $.isArray(source) ){
            this.sourceArray = source;
        }

        if( this.options.sortOn !== null && this.options.sortOn !== ""  ){
            this._sortSource();
        }

        this.subsetArray = this.sourceArray;
    }


    /*
        _sortSource
            @desc: sort input source on user-defined field
    */
    AutoCompletePlugin.prototype._sortSource = function(){
        var sort_property = this.options.sortOn;

        this.sourceArray.sort(function(obj1,obj2){
            var a = obj1[sort_property].toLowerCase();
            var b = obj2[sort_property].toLowerCase();
            if(a < b)
                return -1
            if(a > b)
                return 1
            return 0
        });
    }


    /*
        _createList
            @desc: add div element to DOM for display
    */
    AutoCompletePlugin.prototype._createList = function(){
        this.$listElement =
            $('<div></div>')
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
        _positionList
            @desc: position DOM element correctly (directly below input element)
    */
    AutoCompletePlugin.prototype._positionList = function(){
        var pos =   this.$element.position();
        var left =  pos.left;
        var top =   pos.top + this.$element.outerHeight(false);

        var css = {
            "left":left,
            "top":top,
            "min-width": this.$element.outerWidth(false)
        }

        this.$listElement.css(css);
    }


    /*
        show
            @desc: show the list
    */
    AutoCompletePlugin.prototype.show = function() {
        this.$listElement.css({"display":"block"});
    }


    /*
        hide
            @desc: hide the list
    */
    AutoCompletePlugin.prototype.hide = function() {
        this.$listElement.css({"display":"none"});
    }


    /*
        _keyup
            @desc: callback for keyup events on input
            @param {event object} e: keyup event object
    */
    AutoCompletePlugin.prototype._keyup = function(e){
        var query = this.$element.val();

        //if a change is made, the selected value (if exists)
        //  is no longer valid
        this._clearValue();

        //determine key
        switch(e.which){
            case AutoCompletePlugin.prototype.KEYCODES.backspace:
            case AutoCompletePlugin.prototype.KEYCODES.delete:
                this._clearValue();
                this.subsetArray = this.sourceArray;
                this._filter(false,query);
                break;
            default:
                this._filter(true,query);
        }

        //call user-defined keyup function
        if( typeof this.options.onKeyup === 'function' ){
            this.options.onKeyup.call(null, e);
        }
    }


    /*
        _filter
            @desc: create subset of matching objects
            @param {bool} fromSubset: filter from source or cached subset
            @param {string} _query: value search set for
    */
    AutoCompletePlugin.prototype._filter = function(fromSubset, _query){
        var set = fromSubset === true ? this.subsetArray : this.sourceArray;
        var that = this;
        var query = this.options.caseSensitive === true ? _query : _query.toLowerCase();

        this.subsetArray =
            $.grep(set, function (obj, index) {
                var compare =  obj[that.options.sourceComparitor];
                compare = that.options.caseSensitive === true ? compare : compare.toLowerCase();
                if( compare.includes(query) )
                    return obj;
            });

        this._displayFiltered();
    }


    /*
        _displayFiltered
            @desc: display filtered items in dropdown list
    */
    AutoCompletePlugin.prototype._displayFiltered = function(){
        this.$listElement.empty();
        var that = this;

        if( this.subsetArray.length ){

            $.each(this.subsetArray,function(index, obj){
                var text = "";
                //call user-defined display function
                if( that.options.displayText !== null ){

                    text = that.options.displayText.call(null, obj);
                }else{
                    text = obj[that.options.sourceDisplay];
                }
                var $option = $('<div>'+text+'</div>');

                $option.data(obj);
                that.$listElement.append($option);
            });
            this.show();

        }else{

            this.hide();
        }
    }



    /*
        _select
            @desc: click handler for dropdown list items
            @params {object} list_option: element that received click in dropdown list
    */
    AutoCompletePlugin.prototype._select = function(list_option){
        this.selectedObj = $(list_option).data();

        var text = "";
        //call user-defined display function
        if( typeof this.options.displayText === 'function' ){
            text = this.options.displayText.call(null, this.selectedObj);
        }else{
             text = this.selectedObj[this.options.sourceDisplay];
        }
        this.$element.val(text);
        this.$element.val();
        this.hide();

        //call user-defined onSelect function
        if( typeof this.options.onSelect === 'function' ){
            this.options.onSelect.call(null,this.$element,this.selectedObj);
        }
    }


    /*
        _clearList
            @desc:
    */
    AutoCompletePlugin.prototype._clearList = function(){
        this.$listElement.empty();
    }


    /*
        _clearValue
            @desc: clear selected value and call onDeselct callback
    */
    AutoCompletePlugin.prototype._clearValue = function() {
        this.selectedObj = null;

        //call user-defined onDeselect function
        if( typeof this.options.onDeselect === 'function' ){
            this.options.onDeselect.call(null,this.$element);
        }
    }


    /*
        clear
            @desc: clear input, reset cached subset, hide dropdown
    */
    AutoCompletePlugin.prototype.clear = function(){
        this.$element.val("");
        this.selectedObj = null;
        this.subsetArray = this.sourceArray;
        this._clearList();
        this.hide();
    }


    /*
        value
            @desc: return value of selected item
            @return {object}: object selected by user from dropdown
    */
    AutoCompletePlugin.prototype.value = function(){
        return this.selectedObj;
    }


    /*
        autoComplete
            @params {object} options: user-specified options for plugin
    */
    $.fn.autoComplete = function (options) {

        //TODO: check for function calls before loop! no return possible otherwise!
        this.each(function() {
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
            //call plugin methods if string passed and instance exists
            if( typeof options === 'string' && instance !== undefined){

                return instance[options].call(instance);
            }
            //no plugin instance found
            else if(instance === undefined){
                return;
            }

            //always return instance
            return instance;
        });

    }

}(jQuery));
