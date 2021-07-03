/**
 * This will be a class that allows creation of modal dialog and confirmation boxes without any other special libraries.
 * 
 * Params:
 * textTitle                The title for the dialog, defaults to blank
 * textBody                 The text/html to display as the main body of the dialog, defaults to "Do you want to continue?"
 * customBody               A DIV object to use as the body of the dialog, when specified textBody is ignored, if display on DIV is none it will be set to Block when attached to dialog
 * textAnswerTrue           The text to display on the TRUE button, Defaults to "Yes"
 * textAnswerFalse          The text to display on the FALSE button, Defaults to "No"
 * textAnswerCancel         The text to display on the CANCEL button, Defaults to "Cancel"
 * dialogWidth              The width of the dialog
 * dialogHeight             The height of the dialog
 * dialogMinWidth           The min width of the dialog
 * dialogMinHeight          The min height of the dialog
 * dialogFont               The font name to use for the dialog
 * dialogFontSize           The size of the font for the dialog
 * dialogNoAnimate          FALSE if you wish to have no animation on the dialog as it opens or closes, Defaults to FALSE
 * dialogSquareCorners      FALSE to have slightly rounded corners, TRUE to have right angle corners, Defaults to FALSE
 * weightAnswer             The font weight for the answer buttons, defaults to BOLD
 * zIndex                   The Z Index you wish to display the dialog on.  Defaults to 7,000,000
 * showAnswerFalse          TRUE to display the FALSE button, defaults to false
 * showAnswerCancel         TRUE to display the CANCEL button, defaults to false and can only be TRUE when showAnswerFalse is also TRUE
 * colorAnswerTrue          The color of the TRUE answer button
 * colorAnswerFalse         The color of the FALSE answer button
 * colorAnswerCancel        The color of the CANCEL answer button
 * colorAnswerHoverTrue     The color of the TRUE answer button on hover
 * colorAnswerHoverFalse    The color of the FALSE answer button on hover
 * colorAnswerHoverCancel   The color of the CANCEL answer button on hover
 * onClose                  A callback function to run when the dialog box closes. It should accept a single parameter which returns: 1 (true button); 0 (false button); -1 (cancel button)
 * onOpen                   A callback function to run when the dialog box is opened
 * dialogBuilt              TRUE once the dialog has been completely initialized
 * modalCover               Reference to the modal background cover object
 * modalDialog              Reference to the modal dialog box object
 * dialogTitle              Reference to the dialog title object
 * dialogBody               Reference to the dialog body object
 * answerWrapper            Reference to the dialog answer button container object
 * answerTrue               Reference to the dialog answer true button object
 * answerFalse              Reference to the dialog answer false button object
 * answerCancel             Reference to the dialog answer cancel button object
 * allowBodyScroll          When false, the content under the dialog will not be scrollable.  When true, value set on the page will be used.
 * 
 * Methods:
 * Init()                   Initializes or Re-Initializes the entire dialog.  Causes the dialog to be rebuilt all parameters to be reapplied.
 * ShowDialog()             Displays the dialog
 * CloseDialog()            Receives the user's response, closes the dialog, and calls the onClose callback.
 * Destroy()                Removes all HTML elements generated by the Init() function. Called anytime Init() is called.  If you call it manually, the dialog cannot be displayed again until Init() is called.
 * GetVersion()             Gets the version of spDialog being used.
 * 
 */

class spDialog
{

    static __instances = 0; // Tracks the number of times the constructor has been instantiated.
    static __version = '00.00.07 ALPHA';

    constructor(params)
    {
        this.textTitle = params.textTitle || '';
        this.textBody = params.textBody || (params.showAnswerFalse ? 'Do you want to continue?' : '');
        this.customBody = params.customBody || null;
        this.textAnswerTrue = params.textAnswerTrue || (params.showAnswerFalse ? 'Yes' : 'OK');
        this.textAnswerFalse = params.textAnswerFalse || 'No';
        this.textAnswerCancel = params.textAnswerCancel || 'Cancel';

        this.dialogWidth = params.dialogWidth || '375px';
        this.dialogHeight = params.dialogHeight || '250px';
        this.dialogMinWidth = params.dialogMinWidth || '150px';
        this.dialogMinHeight = params.dialogMinHeight || '100px';
        this.dialogFont = params.dialogFont || 'Verdana, Geneva, Tahoma, sans-serif';
        this.dialogFontSize = params.dialogFontSize || '1rem';
        this.dialogNoAnimate =  params.dialogNoAnimate || false;
        this.dialogAnimateTime = params.dialogAnimateTime || .25;
        this.dialogSquareCorners = params.dialogSquareCorners || false;
        this.weightAnswer = params.weightAnswer || 'bold';
        this.zIndex = params.zIndex || 7000000;
        
        this.allowBodyScroll = params.allowBodyScroll || false;

        this.showAnswerFalse = params.showAnswerFalse || false;
        this.showAnswerCancel = params.showAnswerCancel || false;

        this.colorAnswerTrue = params.colorAnswerTrue || '#dbdbdb';
        this.colorAnswerFalse = params.colorAnswerFalse || '#dbdbdb';
        this.colorAnswerCancel = params.colorAnswerCancel || '#dbdbdb';
        this.colorAnswerHoverTrue = params.colorAnswerHoverTrue || '#d0d0d0';
        this.colorAnswerHoverFalse = params.colorAnswerHoverFalse || '#d0d0d0';
        this.colorAnswerHoverCancel = params.colorAnswerHoverCancel || '#d0d0d0';

        if(!this.showAnswerFalse) { this.showAnswerCancel = false; }

        this.onClose = params.onClose || undefined;
        this.onOpen = params.onOpen || undefined;

        this.dialogBuilt = false;
        this.modalCover = null;
        this.modalDialog = null;
        this.dialogTitle = null;
        this.dialogBody = null;
        this.dialogAnswers = null;
        this.answerWrapper = null;
        this.answerTrue = null;
        this.answerFalse = null;
        this.answerCancel = null;
        this.userResponse = undefined;

        this._instances = ++spDialog.__instances;
        this.__firstRun = true;
        this.__previousScrollType = null;

        this.__result;

        // Build the dialog
        this.Init();
    }

    /**
     * Gets the version of spDialog in use.
     */
    GetVersion()
    {
        return spDialog.__version;
    }

    ShowDialog()
    {
        let self = this;

        /**
         * TODO: Figure out why I have to do this to ensure the animate works on the first try
         *       Animate doesn't fire when developer tries to call ShowDialog immediately after
         *       initializing class instance.  If they call it later, it animates without issue.
         *       Using this approach resolves however it is not without its own issues.
         *       Even just 1ms is enough to bypass the issue, set to 5ms just to be safe.
         */

        // If this is the first run, wait a couple ticks to make sure new HTML has been attached.
        if(self.__firstRun)
        {
            setTimeout(()=> { self.__firstRun = false; self.__ShowDialogReady() } , 5);
        }
        else
        {
            self.__ShowDialogReady();
        }

        // Return a promise, requestor can choose to use it and/or provide a callback for onClose
        // Callback fires BEFORE promise
        return new Promise((resolve, reject) => { 
            self.__result = resolve;
        });
        
    }

    /**
     * Shows the dialog, should not be call outside class
     */
    __ShowDialogReady()
    {
        try
        {
            if(!this.dialogBuilt)
            {
                throw new Error(`The dialog has not yet been built.`);
            }

            this.userResponse = undefined;
        
            if(this.modalCover != null)
            {
                this.modalCover.style.opacity = 1;
                this.modalCover.style.pointerEvents = 'all';

                this.__previousScrollType = document.body.style.overflow;

                if(!this.allowBodyScroll)
                {
                    document.body.style.overflow = 'hidden';
                }

                if(this.onOpen != undefined)
                {
                    this.onOpen();
                }
                
                return true;
            }
            else
            {
                throw new Error(`This instance of spDialog has not been initialized.  Call Init() to reinitialize the dialog`);
            }
        }
        catch(e)
        {
            console.error(e.message, e.name);
            return false;
        }
    }

    /**
     * Close the dialog
     */

    CloseDialog(response)
    {
        try
        {
            this.modalCover.style.opacity = 0;
            this.modalCover.style.pointerEvents = 'none';
            this.userResponse = response;

            if(!this.allowBodyScroll)
            {
                document.body.style.overflow = this.__previousScrollType;
            }

            if(this.onClose != undefined)
            {
                this.onClose(response);
            }

            this.__result(response);
                        
            return true;
        }
        catch(e)
        {
            console.error(e.message, e.name);
            this.__result(response);
            return false;
        }
    }

    /**
     * Sets up the dialog box     
     */
    Init()
    {
        
        this.Destroy();

        try
        {
            let suffix = this._instances;
            let n = document.createElement('div');

            n.id = `spDialogCover_${suffix}`;
            n.style.backgroundColor = 'rgba(0,0,0,.5)';
            n.style.opacity = 0;
            if(!this.dialogNoAnimate){ n.style.transition = `${this.dialogAnimateTime}s ease-in-out` }
            n.style.position = 'fixed';
            n.style.top = 0;
            n.style.left = 0;
            n.style.bottom = 0;
            n.style.right = 0;
            n.style.zIndex = this.zIndex;
            n.style.boxSizing = 'content-box';

            this.modalCover = document.body.appendChild(n);
            this.modalCover.style.fontFamily = this.dialogFont;
            this.modalCover.style.fontSize = this.dialogFontSize;
            
            let nd = document.createElement('div');
            nd.id = `spDialog_Box_${suffix}`;
            nd.style.backgroundColor = '#ffffff';
            nd.style.border = '2px solid #000000';
            nd.style.borderRadius = (!this.dialogSquareCorners ? '10px' : '0px');
            nd.style.padding = '20px';
            nd.style.width = this.dialogWidth;
            nd.style.height = this.dialogHeight;
            nd.style.minHeight = this.dialogMinHeight;
            nd.style.minWidth = this.dialogMinWidth;
            nd.style.maxWidth = '95%';
            nd.style.maxHeight = '95%';
            nd.style.position = 'relative';
            nd.style.top = '50%';
            nd.style.left = '50%';
            nd.style.transform = 'translate(-50%, -50%)';
            nd.style.display = 'block';
            nd.style.boxSizing = 'inherit';

            this.modalDialog = this.modalCover.appendChild(nd);

            // Make sure our dialog clicks don't pass through to the modal background, 
            // this would be an issue for non-confirmation dialogs
            this.modalDialog.addEventListener('click', function(event){ event.stopPropagation(); return false; });

            let ndt = document.createElement('div');
            ndt.id = `spDialog_Box_Title_${suffix}`;
            ndt.style.textAlign = 'center';
            ndt.style.fontWeight = 'bold';
            ndt.style.fontSize = '1em';
            ndt.innerHTML = this.textTitle;
            ndt.style.height = '20%';
            ndt.style.overflow = 'hidden';
            ndt.style.boxSizing = 'inherit';

            this.dialogTitle = ndt;

            document.getElementById(`spDialog_Box_${suffix}`).appendChild(ndt);

            let ndb = document.createElement('div');
            ndb.id = `spDialog_Box_Body_${suffix}`;
            ndb.style.display = 'block';
            ndb.style.textAlign = 'left';
            ndb.style.fontWeight = 'normal';
            ndb.style.fontSize = '1em';
            ndb.style.paddingBottom = '10px';
            //ndb.style.minHeight = '*';
            ndb.style.height = '60%';
            ndb.style.overflowY = 'auto';
            ndb.style.boxSizing = 'inherit';

            if(this.customBody == null)
            {
                ndb.innerHTML = this.textBody;
            }
            else
            {
                ndb.appendChild(this.customBody);
                if(this.customBody.style.display == 'none'){ this.customBody.style.display = 'block' }
            }

            this.dialogBody = ndb;

            document.getElementById(`spDialog_Box_${suffix}`).appendChild(ndb);

            let ndacnt = document.createElement('div');
            ndacnt.id = `spDialog_Box_Answers_Container_${suffix}`;
            ndacnt.style.height = '20%';
            ndacnt.style.display = 'flex';
            ndacnt.style.flexDirection = 'column';
            ndacnt.style.width = '100%';

            document.getElementById(`spDialog_Box_${suffix}`).appendChild(ndacnt);

            let nda = document.createElement('div');
            nda.id = `spDialog_Box_Answers_${suffix}`;
            nda.style.textAlign = 'center';
            nda.style.fontWeight = 'normal';
            nda.style.position = 'relative';
            nda.style.display = 'table';
            nda.style.borderCollapse = 'separate';
            nda.style.borderSpacing = '5px';
            nda.style.marginTop = 'auto';
            nda.style.marginLeft = 'auto';
            nda.style.marginRight = 'auto';
            nda.style.alignSelf = 'flex-start';
            nda.style.boxSizing = 'inherit';
            
            let answers = `
                <div id='spDialog_Box_Answers_Wrapper_${suffix}'>
                    <div id='spDialog_Box_Answer_True_${suffix}'>${this.textAnswerTrue}</div>
                    <div id='spDialog_Box_Answer_False_${suffix}' ${ (!this.showAnswerFalse ? "style='display: none'" : '') }>${this.textAnswerFalse}</div>
                    <div id='spDialog_Box_Answer_Cancel_${suffix}' ${ (!this.showAnswerCancel ? "style='display: none'" : '') }>${this.textAnswerCancel}</div>
                </div>`;
            nda.innerHTML = answers;

            ndacnt.appendChild(nda);

            let self = this;
            let ndat = document.getElementById(`spDialog_Box_Answer_True_${suffix}`);
            
            ndat.addEventListener('click', function(event){ self.CloseDialog(1) });
            ndat.addEventListener('mouseenter', function(event){ this.style.backgroundColor = self.colorAnswerHoverTrue });
            ndat.addEventListener('mouseleave', function(event){ this.style.backgroundColor = self.colorAnswerTrue });
            
            ndat.style.display = 'table-cell';
            ndat.style.cursor = 'pointer';
            ndat.style.border = '1px solid #000000';
            ndat.style.borderRadius = '5px';
            ndat.style.padding = '5px';
            ndat.style.fontSize = '.75em';
            ndat.style.backgroundColor = this.colorAnswerTrue;
            ndat.style.width = '33%';
            ndat.style.textAlign = 'center';
            ndat.style.boxSizing = 'inherit';

            this.answerTrue = ndat;

            if(this.showAnswerFalse)
            {
                let ndaf = document.getElementById(`spDialog_Box_Answer_False_${suffix}`);
                ndaf.addEventListener('click', function(event){ self.CloseDialog(0) });
                ndaf.addEventListener('mouseenter', function(event){ this.style.backgroundColor = self.colorAnswerHoverFalse });
                ndaf.addEventListener('mouseleave', function(event){ this.style.backgroundColor = self.colorAnswerFalse });

                ndaf.style.display = 'table-cell';
                ndaf.style.cursor = 'pointer';
                ndaf.style.border = '1px solid #000000';
                ndaf.style.borderRadius = '5px';
                ndaf.style.padding = '5px';
                ndaf.style.fontSize = '.75em';
                ndaf.style.backgroundColor = this.colorAnswerFalse;
                ndaf.style.width = '33%';
                ndaf.style.textAlign = 'center';
                ndaf.style.boxSizing = 'inherit';

                this.answerFalse = ndaf;
            }

            if(this.showAnswerCancel)
            {
                let ndac = document.getElementById(`spDialog_Box_Answer_Cancel_${suffix}`);
                ndac.addEventListener('click', function(event){ self.CloseDialog(-1) });
                ndac.addEventListener('mouseenter', function(event){ this.style.backgroundColor = self.colorAnswerHoverCancel });
                ndac.addEventListener('mouseleave', function(event){ this.style.backgroundColor = self.colorAnswerCancel });

                ndac.style.display = 'table-cell';
                ndac.style.cursor = 'pointer';
                ndac.style.border = '1px solid #000000';
                ndac.style.borderRadius = '5px';
                ndac.style.padding = '5px';
                ndac.style.fontSize = '.75em';
                ndac.style.backgroundColor = this.colorAnswerCancel;
                ndac.style.width = '33%';
                ndac.style.textAlign = 'center';
                ndac.style.boxSizing = 'inherit';

                this.answerCancel = ndac;
            }

            let ndaw = document.getElementById(`spDialog_Box_Answers_Wrapper_${suffix}`);
            ndaw.style.position = 'relative';
            ndaw.style.fontWeight = this.weightAnswer;
            ndaw.style.display = 'table-row';
            ndaw.style.boxSizing = 'inherit';

            this.answerWrapper = ndaw;

            this.dialogAnswers = ndacnt;

            this.modalCover.style.pointerEvents = 'none';

            if(!this.showAnswerFalse && !this.showAnswerCancel)
            {
                this.modalCover.addEventListener('click', function(event){ self.CloseDialog(1) });
            }

            this.dialogBuilt = true;
            
            return true;
        }
        catch(e)
        {
            console.error(e.message, e.name);
            return false;
        }

    }

    /**
     * Removes all HTML elements created by Init() and resets references to those objects to null.
     * Call Init() again to re-initialize the dialog
     */
    Destroy()
    {
        try
        {    
            if(this.modalCover != null)
            {
                let tmp = document.getElementById(this.modalCover.id);
                if(tmp != null)
                {
                    while(tmp.firstChild)
                    {
                        tmp.firstChild.remove();
                    }
                    tmp.parentNode.removeChild(tmp);

                }

                this.modalCover = null;
                this.modalDialog = null;
                this.dialogTitle = null;
                this.dialogBody = null;
                this.answerWrapper = null;
                this.answerTrue = null;
                this.answerFalse = null;
                this.answerCancel = null;
                
                this.dialogBuilt = false;

            }

            return true;
        }
        catch(e)
        {
            console.error(e.message, e.name);
            return false;
        }
    }

    __DelayDialog(ms)
    {
        //return new Promise(resolve => setTimeout(resolve, ms));
        return Promise.resolve(setTimeout(()=> {return true}, ms));
    }

}