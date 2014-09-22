import ghostPaths from 'ghost/utils/ghost-paths';

var UploadUi,
    upload,
    Ghost = ghostPaths();


UploadUi = function ($dropzone, settings) {
    $.extend(this, {
        complete: function (result) {
            var self = this;

            function showImage(width, height) {
                $dropzone.find('img.js-upload-target').attr({'width': width, 'height': height}).css({'display': 'block'});
                $dropzone.find('.fileupload-loading').remove();
                $dropzone.css({'height': 'auto'});
                $dropzone.delay(250).animate({opacity: 100}, 1000, function () {
                    $('.js-button-accept').prop('disabled', false);
                    self.init();
                });
            }

            function animateDropzone($img) {
                $dropzone.animate({opacity: 0}, 250, function () {
                    $dropzone.removeClass('image-uploader').addClass('pre-image-uploader');
                    $dropzone.css({minHeight: 0});
                    self.removeExtras();
                    $dropzone.animate({height: $img.height()}, 250, function () {
                        showImage($img.width(), $img.height());
                    });
                });
            }

            function preLoadImage() {
                var $img = $dropzone.find('img.js-upload-target')
                    .attr({'src': '', 'width': 'auto', 'height': 'auto'});

                $progress.animate({'opacity': 0}, 250, function () {
                    $dropzone.find('span.media').after('<img class="fileupload-loading"  src="' + Ghost.subdir + '/ghost/img/loadingcat.gif" />');
                    if (!settings.editor) {$progress.find('.fileupload-loading').css({'top': '56px'}); }
                });
                $dropzone.trigger('uploadsuccess', [result]);
                $img.one('load', function () {
                    animateDropzone($img);
                }).attr('src', result);
            }
            preLoadImage();
        },

        bindFileUpload: function () {
            var self = this;

            $dropzone.find('.js-fileupload').fileupload().fileupload('option', {
                url: Ghost.apiRoot + '/uploads/',
                dropZone: settings.fileStorage ? $dropzone : null,
                progressall: function (e, data) {
                    /*jshint unused:false*/
                    var progress = parseInt(data.loaded / data.total * 100, 10);
                    if (!settings.editor) {$progress.find('div.js-progress').css({'position': 'absolute', 'top': '40px'}); }
                    if (settings.progressBar) {
                        $dropzone.trigger('uploadprogress', [progress, data]);
                        $progress.find('.js-upload-progress-bar').css('width', progress + '%');
                    }
                },
                fail: function (e, data) {
                    /*jshint unused:false*/
                    $('.js-button-accept').prop('disabled', false);
                    $dropzone.trigger('uploadfailure', [data.result]);
                    $dropzone.find('.js-upload-progress-bar').addClass('fail');
                    if (data.jqXHR.status === 413) {
                        $dropzone.find('div.js-fail').text('The image you uploaded was larger than the maximum file size your server allows.');
                    } else if (data.jqXHR.status === 415) {
                        $dropzone.find('div.js-fail').text('The image type you uploaded is not supported. Please use .PNG, .JPG, .GIF, .SVG.');
                    } else {
                        $dropzone.find('div.js-fail').text('Something went wrong :(');
                    }
                    $dropzone.find('div.js-fail, button.js-fail').fadeIn(1500);
                    $dropzone.find('button.js-fail').on('click', function () {
                        $dropzone.css({minHeight: 0});
                        $dropzone.find('div.description').show();
                        self.removeExtras();
                        self.init();
                    });
                },
                done: function (e, data) {
                    /*jshint unused:false*/
                    self.complete(data.result);
                }
            });
        },

        buildExtras: function () {
            if (!$dropzone.find('span.media')[0]) {
                $dropzone.prepend('<span class="media"><span class="hidden">Image Upload</span></span>');
            }
            if (!$dropzone.find('div.description')[0]) {
                $dropzone.append('<div class="description">Add image</div>');
            }
            if (!$dropzone.find('div.js-fail')[0]) {
                $dropzone.append('<div class="js-fail failed" style="display: none">Something went wrong :(</div>');
            }
            if (!$dropzone.find('button.js-fail')[0]) {
                $dropzone.append('<button class="js-fail btn btn-green" style="display: none">Try Again</button>');
            }
            if (!$dropzone.find('a.image-url')[0]) {
                $dropzone.append('<a class="image-url" title="Add image from URL"><span class="hidden">URL</span></a>');
            }
//                if (!$dropzone.find('a.image-webcam')[0]) {
//                    $dropzone.append('<a class="image-webcam" title="Add image from webcam"><span class="hidden">Webcam</span></a>');
//                }
        },

        removeExtras: function () {
            $dropzone.find('span.media, div.js-upload-progress, a.image-url, a.image-upload, a.image-webcam, div.js-fail, button.js-fail, a.js-cancel').remove();
        },
        initWithImage: function () {
            var self = this;
            // This is the start point if an image already exists
            $dropzone.removeClass('image-uploader image-uploader-url').addClass('pre-image-uploader');
            $dropzone.find('div.description').hide();
            $dropzone.append($cancel);
            $dropzone.find('.js-cancel').on('click', function () {
                $dropzone.find('img.js-upload-target').attr({'src': ''});
                $dropzone.find('div.description').show();
                $dropzone.delay(2500).animate({opacity: 100}, 1000, function () {
                    self.init();
                });

                $dropzone.trigger('uploadsuccess', 'http://');
                self.initWithDropzone();
            });
        },

        init: function () {
            var imageTarget = $dropzone.find('img.js-upload-target');
            // First check if field image is defined by checking for js-upload-target class
            if (!imageTarget[0]) {
                // This ensures there is an image we can hook into to display uploaded image
                $dropzone.prepend('<img class="js-upload-target" style="display: none"  src="" />');
            }
            $('.js-button-accept').prop('disabled', false);
            if (imageTarget.attr('src') === '' || imageTarget.attr('src') === undefined) {
                this.initWithDropzone();
            } else {
                this.initWithImage();
            }
        }
    });
};


upload = function (options) {
    var settings = $.extend({
        progressbar: true,
        editor: false,
        fileStorage: true
    }, options);
    return this.each(function () {
        debugger;
        var $dropzone = $(this),
            ui;

        ui = new UploadUi($dropzone, settings);
        ui.init();
    });
};

var PostImageUploader = Ember.Component.extend({
    classNameBindings: ['uploadWithUrl:image-uploader-url', ':image-uploader', ':js-post-image-upload'],

    // options
    progressBar: true,
    editor: false,
    fileStorage: Ember.computed.alias('config.fileStorage'),
    options: Ember.computed('progressBar', 'editor', 'fileStorage', function () {
        return this.getProperties('progressBar', 'editor', 'fileStorage');
    }),

    //state
    uploadMethod: null,
    initializeState: function () {
        var state = this.get('fileStorage') ? 'dropzone' : 'url';
        this.set('uploadMethod', state);
    }.on('init'),
    uploadWithDropzone: Ember.computed.equal('uploadMethod', 'dropzone'),
    uploadWithUrl: Ember.computed.equal('uploadMethod', 'url'),

    actionTitle: Ember.computed('uploadMethod', function () {
        return this.get('uploadWithUrl') ?
            'Add image from URL' : 'Add image';
    }),

    createFileUploadOptions: function () {
        var settings = this.get('options'),
            ui = this.get('ui'),
            $dropzone = this.$();
        return {
            url: Ghost.apiRoot + '/uploads/',
            //Only files dragged to the element should be uploaded;
            // you can't just drag to the window
            // for some reason this depends on fileStorage???
            dropZone: settings.fileStorage ? $dropzone : null,

            add: this.get('fileAddedHandler'),
            //Callback for global upload progress events
            //update the progress bar
            progressall: function (e, data) {
                /*jshint unused:false*/
                var progress = parseInt(data.loaded / data.total * 100, 10);
                if (!settings.editor) {$progress.find('div.js-progress').css({'position': 'absolute', 'top': '40px'}); }
                if (settings.progressbar) {
                    $dropzone.trigger('uploadprogress', [progress, data]);
                    $progress.find('.js-upload-progress-bar').css('width', progress + '%');
                }
            },
            fail: function (e, data) {
                /*jshint unused:false*/
                $('.js-button-accept').prop('disabled', false);
                $dropzone.trigger('uploadfailure', [data.result]);
                $dropzone.find('.js-upload-progress-bar').addClass('fail');
                if (data.jqXHR.status === 413) {
                    $dropzone.find('div.js-fail').text('The image you uploaded was larger than the maximum file size your server allows.');
                } else if (data.jqXHR.status === 415) {
                    $dropzone.find('div.js-fail').text('The image type you uploaded is not supported. Please use .PNG, .JPG, .GIF, .SVG.');
                } else {
                    $dropzone.find('div.js-fail').text('Something went wrong :(');
                }
                $dropzone.find('div.js-fail, button.js-fail').fadeIn(1500);
                $dropzone.find('button.js-fail').on('click', function () {
                    $dropzone.css({minHeight: 0});
                    $dropzone.find('div.description').show();
                    //@TODO
                    ui.removeExtras();
                    ui.init();
                });
            },
            done: function (e, data) {
                /*jshint unused:false*/
                ui.complete(data.result);
            }
        };
    },

    setup: function () {
        var options = this.get('options'),
            self = this,
            $this = this.$(),
            imageSrc = this.get('image'),
            ui;

        ui = new UploadUi($this, options);
        this.set('ui', ui);

        if (imageSrc) {
            ui.initWithImage();
        } else {
            //bind file upload
            $this.find('.js-fileupload').fileupload(this.createFileUploadOptions());

        }

        $this.on('uploadsuccess', function (event, result) {
            if (result && result !== 'http://') {
                self.sendAction('uploaded', result);
            }
        });
    }.on('didInsertElement'),

    /**
    fileupload event handlers
    **/

    bindHandler: function (handler) {
        var handlerFunc = this.get(handler);
        this.set(handler, _.bind(handlerFunc, this));
    },

    fileQueuedHandler: function (event, data) {
        var $dropzone = this.$();
        /*jshint unused:false*/
        this.set('uploading', true);
        //$('.js-button-accept').prop('disabled', true);
        //$dropzone.find('.js-fileupload').removeClass('right');
        //$dropzone.find('.js-url').remove();
        //$progress.find('.js-upload-progress-bar').removeClass('fail');
        this.send('uploadStart');
        //$dropzone.trigger('uploadstart', [$dropzone.attr('id')]);
        $dropzone.find('span.media, div.description, a.image-url, a.image-webcam')
            .animate({opacity: 0}, 250, function () {
                $dropzone.find('div.description').hide().css({'opacity': 1});
                if (settings.progressBar) {
                    //@todo
                    //$dropzone.find('div.js-fail').after($progress);
                    //$progress.animate({opacity: 1}, 250);
                }
            //only after all this flourishing should
            // the file actually be sent!? WAI U WAIT BRO
                data.submit();
            });
    },
    bindFileQueuedHandler: function () {
        this.bindHandler('fileQueuedHandler');
    }.on('init'),

    removeListeners: function () {
        var $this = this.$();
        $this.off();
        $this.find('.js-cancel').off();
    }.on('willDestroyElement'),

    actions: {
        toggleUploadMethod: function () {
            var method = this.get('uploadWithUrl') ? 'dropzone' : 'url';
            this.set('uploadMethod', method);
        },
        canceled: function () {
            this.sendAction('canceled');
        }
    }
});

export default PostImageUploader;

