document.addEventListener("DOMContentLoaded", function(event) {

  var componentManager;
  var workingNote, clientData;
  var lastValue, lastUUID;
  var editor;
  var ignoreTextChange = false;
  var newNoteLoad = true, didToggleFullScreen = false;

  function loadComponentManager() {
    var permissions = [{name: "stream-context-item"}]
    componentManager = new ComponentManager(permissions, function(){
      // on ready
    });

    componentManager.streamContextItem((note) => {
      onReceivedNote(note);
    });
  }

  function strip(html) {
    var tmp = document.implementation.createHTMLDocument("New").body;
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  function truncateString(string, limit = 90) {
    if(string.length <= limit) {
      return string;
    } else {
      return string.substring(0, limit) + "...";
    }
  }

  function save() {
    if(workingNote) {
      componentManager.saveItemWithPresave(workingNote, () => {
        lastValue = $('#summernote').summernote('code');
        workingNote.clientData = clientData;

        workingNote.content.text = lastValue;
        workingNote.content.preview_plain = truncateString(strip(lastValue));
        workingNote.content.preview_html = null;
      });
    }
  }

  function onReceivedNote(note) {
    if(note.uuid !== lastUUID) {
      // Note changed, reset last values
      lastValue = null;
      newNoteLoad = true;
      lastUUID = note.uuid;
    }

    workingNote = note;

    // Only update UI on non-metadata updates.
    if(note.isMetadataUpdate) {
      return;
    }

    clientData = note.clientData;
    var newText = note.content.text;

    if(newText == lastValue) {
      return;
    }

    var summernote = $('#summernote');
    if(summernote) {
      ignoreTextChange = true;
      var isHtml = /<[a-z][\s\S]*>/i.test(newText);

      if(!didToggleFullScreen) {
        $('#summernote').summernote('fullscreen.toggle');
        didToggleFullScreen = true;
      }

      if(newNoteLoad && !isHtml) {
        newText = textToHTML(newText);
      }

      summernote.summernote('code', newText);

      if(newNoteLoad) {
        // Clears history but keeps note contents. Note that this line will triggera summernote.change event,
        // so be sure to do this inside a `ignoreTextChange` block
        $('#summernote').summernote('commit');
        newNoteLoad = false;
      }

      ignoreTextChange = false;
    }
  }

  function loadEditor() {
    $('#summernote').summernote({
      height: 500,                 // set editor height
      minHeight: null,             // set minimum height of editor
      maxHeight: null,             // set maximum height of editor
      focus: true,                  // set focus to editable area after initializing summernote
      toolbar: [
        // [groupName, [list of button]]
        ['para', ['style']],
        ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
        ['fontsize', ['fontsize', 'fontname']],
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['height', ['height']],
        ['insert', ['table', 'link', 'hr', 'picture', 'video']],
        ['misc', ['codeview', 'help']]
      ],
      callbacks: {
        onInit: function() {},
        onImageUpload: function (files) {
          alert("Until we can encrypt image files, uploads are not currently supported. We recommend using the Image button in the toolbar and copying an image URL instead.")
        }
      }
    });

    // summernote.change
    $('#summernote').on('summernote.change', function(we, contents, $editable) {
      if(!ignoreTextChange) {
        save();
      }
    });

    $('textarea.note-codable').on('input', () => {
      save();
    })
  }

  loadEditor();
  loadComponentManager();

  function textToHTML(text) {
    return ((text || "") + "").replace(/\t/g, "    ").replace(/\r\n|\r|\n/g, "<br />");
  }

});
