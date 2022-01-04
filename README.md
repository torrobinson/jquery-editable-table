# jquery-editable-table
A small jQuery extension to turn an HTML table editable for fast data entry and validation

# Demo
👉 https://jsfiddle.net/torrobinson/63z182vL/ 👈
<br/><br/>
---
<br/><br/>

# Config
```
{
 columns: [], // required
 actions: []  // optional
}
```

## columns
| Option             | Type                        | Description                                                                                                                                          |
|--------------------|-----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| index              | int                         | The index of the column in the physical table                                                                                                        |
| isHidden              | bool                         | Whether or not to hide the column from being seen/edited                                                                                                       |
| name               | string                        | The name of the attribute bound to this column                                                                                                       |
| maxLength               | int                        | The max length allowed to input                                                                                                       |
| classes            | array                       | An array of CSS classes to assign to this column's cells                                                                                             |
| convertOut         | function(internalValue)     | A function to take an internal value (most likely a string) to format or cast it when the value is being extracted with `getData()`                  |
| isValid            | function(newValue, allData) | A function to validate a new valid being added. Function provides all table data to compare against.                                                 |
| afterChange        | function(newValue, cell)    | A function that is executed after a cell value is changed (and validated). It provides the new value, as well as the physical table cell holding it. |
| removeRowIfCleared | bool                        | If true, when this cell value is cleared for a row, the entire row will be removed.                                                                  |

## actions
| Option             | Type                        | Description                                                                                                                                          |
|--------------------|-----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| label              | string                         | HTML for the button or icon for this action                                                                                                |
| action              | function(clickEventArgs, row)         | The action to perform when the button/icon is clicked                                                             

---
<br/><br/>

# Functions
| Function | Parameters   | Description                                           |
|----------|--------------|-------------------------------------------------------|
| getData  | ()           | Returns all table data (array)                        |
| setData  | (data array) | Accepts data (array) and sets the table to this state |
| addRow   | (newRow)     | Accepts an object and adds to the end of table data   |
| clear    | ()           | Clears all data from the table                        |

# Example...
```html
 <table id="sample-table">
   <thead>
     <tr>
       <th>Unique Id</th>
       <th>Number</th>
     </tr>
   </thead>
   <tbody>
   </tbody>
</table>
```

```js
$('#sample-table').editableTable({
    columns: [
        // Example of a field that must be unique
        {
            index: 0,
            name: 'id',
            removeRowIfCleared: true,
            isValid: (newVal, data) => {
                // Ensure the id number is unique
                let allIds = data.map(p => p.id);
                return !allIds.includes(newVal);
            }
        },
        // Example of a number that is validated as an int
        {
            index: 1,
            name: 'number',
            classes: ['text-end'],
            isValid: (val) => {
                val = parseInt(val);
                return !isNaN(val) && Number.isInteger(val);
            }
        }
    ],
    actions: [
    	{
      	label: '<button>Delete</button>',
        action: (e, row) => {
        	 // Remove the row from the table
          row.remove();
        }
      },
    ]
});
```
