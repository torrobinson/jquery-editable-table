$.fn.editableTable = function (options) {
    // Default options
    let defaultOptions = {
        cloneProperties: ['padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
            'text-align', 'font', 'font-size', 'font-family', 'font-weight',
            'border', 'border-top', 'border-bottom', 'border-left', 'border-right', 'color', 'background-color', 'border-radius'],
        columns: []
    }

    // Overlay default options on user options
    options = $.extend({}, defaultOptions, options);

    // The instance reference we'll pass to the user
    let _instance;

    // Class to put on the editor to denote an error
    let errorClass = 'error';

    // Something to tag the hidden input with
    let identifierAttribute = 'table-editor-input';

    // Keycodes
    let ARROW_LEFT = 37,
        ARROW_UP = 38,
        ARROW_RIGHT = 39,
        ARROW_DOWN = 40,
        ENTER = 13,
        ESC = 27,
        TAB = 9,
        CONTROL = 17,
        LEFT_WINDOWS = 91,
        SELECT_KEY = 93;

    // The table element
    let element = $(this);
    
    // Show all columns and then hide any hidden ones
    element.find('th').show();
    options.columns.forEach((col, i)=>{
    	if(col.isHidden !== undefined && col.isHidden) element.find('th').eq(i).hide();
    });
    

    // The textbox allowing user input. Only add if there's not already an editor input control around
    let editor;
    let existingEditor = element.parent().find(`input[${identifierAttribute}]`);
    if (existingEditor.length) {
        editor = existingEditor.first();
    }
    else {
        editor = $('<input>');
    }

    // Add it to the DOM
    editor.attr(identifierAttribute, '')
        .css('position', 'absolute')
        .hide()
        .appendTo(element.parent());

    // The `td` being "edited"
    let activeCell;

    // Function to show the editor
    function showEditor(select) {
        // Set the active cell
        activeCell = element.find('td:focus');
        if (activeCell.length) {
            // Prepare
            editor.val(activeCell.text())							// Throw the value in
                .removeClass(errorClass)							// remove any error classes
                .show()												// show it
                .offset(activeCell.offset())					    // position it
                .css(activeCell.css(options.cloneProperties))		// make it look similar by cloning properties
                .width(activeCell.width())							// size it
                .height(activeCell.height())						// size it
                .focus();											// focu user input into it
            if (select) {
                editor.select();
            }
        }
    };

    function setActiveText() {
        let text = editor.val(),
            evt = $.Event('change'),
            originalContent;
        if (activeCell.text() === text || editor.hasClass(errorClass)) {
            return true;
        }
        originalContent = activeCell.html();
        activeCell.text(text).trigger(evt, text);
        if (evt.result === false) {
            activeCell.html(originalContent);
        }
    };

    // For traversing the table up/down/left/right by returning the adjacent cell
    function handleMovement(element, keycode) {
        if (keycode === ARROW_RIGHT) {
            return element.next('td');
        } else if (keycode === ARROW_LEFT) {
            return element.prev('td');
        } else if (keycode === ARROW_UP) {
            return element.parent().prev().children().eq(element.index());
        } else if (keycode === ARROW_DOWN) {
            return element.parent().next().children().eq(element.index());
        }
        return [];
    };

    // On the editor losing focus, hide the input
    editor.blur(function () {
        setActiveText();
        editor.hide();
    });

    // Handle typing into the input
    editor.keydown(function (e) {
        if (e.which === ENTER) {
            setActiveText();
            editor.hide();
            activeCell.focus();
            e.preventDefault();
            e.stopPropagation();
        } else if (e.which === ESC) {
            editor.val(activeCell.text());
            e.preventDefault();
            e.stopPropagation();
            editor.hide();
            activeCell.focus();
        } else if (e.which === TAB) {
            activeCell.focus();
        } else if (this.selectionEnd - this.selectionStart === this.value.length) {
            let possibleMove = handleMovement(activeCell, e.which);
            if (possibleMove.length > 0) {
                possibleMove.focus();
                e.preventDefault();
                e.stopPropagation();
            }
        }
    });

    // Validate cell input on typing or pasting
    editor.on('input paste', function () {
        let evt = $.Event('validate');
        activeCell.trigger(evt, editor.val());
        if (evt.result !== undefined) {
            if (evt.result === false) {
                editor.addClass(errorClass);
            } else {
                editor.removeClass(errorClass);
            }
        }
    });

    // On table clicking, move around cells
    element.on('click keypress dblclick', showEditor)
        .css('cursor', 'pointer')
        .keydown(function (e) {
            let prevent = true,
                possibleMove = handleMovement($(e.target), e.which);
            if (possibleMove.length > 0) {
                possibleMove.focus();
            } else if (e.which === ENTER) {
                showEditor(false);
            } else if (e.which === CONTROL || e.which === LEFT_WINDOWS || e.which === SELECT_KEY) {
                showEditor(true);
                prevent = false;
            } else {
                prevent = false;
            }
            if (prevent) {
                e.stopPropagation();
                e.preventDefault();
            }
        });

    element.find('td').prop('tabindex', 1);

    $(window).on('resize', function () {
        if (editor.is(':visible')) {
            editor.offset(activeCell.offset())
                .width(activeCell.width())
                .height(activeCell.height());
        }
    });

    function refresh() {
        $(element).editableTable(options);
    }

    // Validate based on options
    $('table td').on('validate', function (evt, newValue) {
        let currentColIndex = $(evt.currentTarget).parent().children('td').index($(evt.currentTarget));
        let columnDef = options.columns[currentColIndex];
        let currentData = _instance.getData({ convert: false }); // current data to allow user to validate based on existing data
        let isValid = columnDef.isValid && columnDef.isValid(newValue, currentData);
        return isValid;
    });

    $('table td').on('change', function (evt, newValue) {
        let td = $(this);
        let currentColIndex = $(evt.currentTarget).parent().children('td').index($(evt.currentTarget));
        let columnDef = options.columns[currentColIndex];

        if (columnDef.removeRowIfCleared && newValue == '') {
            td.parent('tr').remove();
        }

        // Bind user-specified events if they exist
        if (typeof columnDef.afterChange == 'function') {
            columnDef.afterChange(newValue, td);
        }

        return true;
    });

    // Set up the instance reference
    _instance = {
        // Get table back out as JSON
        getData: function (opts) {
            opts = $.extend({}, {
                convert: true
            }, opts);

            let rowData = [];
            element.find('tbody tr').toArray().forEach(row => {
                let newRow = {};

                $(row).find('td').toArray().forEach(col => {
                    let columnsDef = options.columns[
                        $(col).parent().children('td').index($(col)) // only index at cells, or "td"s
                    ];

                    let value = $(col).text();

                    // Check if the cell was marked as having a null value, and if so, extract as null and not
                    // as a blank string
                    let isNull = $(col).attr('data-is-null');
                    if (typeof isNull !== 'undefined' && isNull !== false) {
                        value = null;
                    }

                    // Convert if requried
                    if (opts.convert && typeof columnsDef.convertOut == 'function') {
                        value = columnsDef.convertOut(value);
                    }

                    newRow[columnsDef.name] = value;
                });

                rowData.push(newRow);
            });
            return rowData;
        },

        // Add a new row with JSON
        addRow: function (row) {
            let newRow = $(`<tr></tr>`);

            if (row !== undefined && row !== null) {
                let props = Object.keys(row);

                let columnsToAdd = [];
                props.forEach(prop => {
                    let columnDef = options.columns.filter(col => col.name === prop);
                    if (columnDef.length) {
                        columnDef = columnDef[0];
                        columnsToAdd.push({
                            order: columnDef.index,
                            value: row[prop],
                            prop: prop,
                            def: columnDef
                        });
                    }
                })
                columnsToAdd.sort((a, b) => a.order - b.order).forEach((colToAdd, index) => {
                    let newCell;
                    if (colToAdd.value !== null)
                        newCell = $(`<td>${colToAdd.value}</td>`);
                    else
                        newCell = $(`<td data-is-null></td>`);
                        
                   	// Apply any classes
                    if (colToAdd.def.classes !== undefined && colToAdd.def.classes.length) {
                        colToAdd.def.classes.forEach(classToAdd => newCell.addClass(classToAdd));
                    }

										// Apply any style
                    if (colToAdd.def.style !== undefined && colToAdd.def.style.length) {
                        newCell.attr("style", newCell.attr("style") + "; " + colToAdd.def.style);
                    }
                    
                    // Hide if hidden
                    if (colToAdd.def.isHidden !== undefined && colToAdd.def.isHidden) {
                        newCell.hide();
		            }
			
		            // Add to the column
                    newRow.append(newCell);

                    // Trigger any events
                    let columnDef = options.columns.filter(col => col.name === colToAdd.prop)[0];
                    if (typeof columnDef.afterAdd == 'function') {
                        columnDef.afterAdd(colToAdd.value, newCell);
                    }
                });

            }
            else {
                newRow = $(`<tr></tr>`);
                activeOptions.columns.forEach(x => {
                    newRow.append(`<td></td>`);
                });
            }

            // Add the new row
            let lastRow = element.find('tbody tr:last');
            if (lastRow.length > 0)
                lastRow.after(newRow);
            else
                element.find('tbody').append(newRow);

            refresh();
        },

        // Clear the table
        clear: function () {
            element.find('tbody tr').remove();
        },

        // Set the table's data with JSON
        setData: function (data) {
            if (data) {
                this.clear();
                data.forEach(datum => {
                    this.addRow(datum);
                });
            }
        }

    };
    return _instance;
};
