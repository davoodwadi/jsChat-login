The `scrollIntoView` method in JavaScript can be used to scroll an element into the visible area of the browser window. This method can accept an options object to control the alignment and behavior of the scroll.

### Syntax

```javascript
element.scrollIntoView(options);
```

### Options

The `options` object can have the following properties:

1. **behavior** (Optional): Defines the transition animation. Can be one of:
   - `'auto'` (default): The scroll happens instantly.
   - `'smooth'`: The scroll happens smoothly.

2. **block** (Optional): Defines the vertical alignment. Can be one of:
   - `'start'` (default): Aligns the element to the top of the scroll area.
   - `'center'`: Aligns the element to the center of the scroll area.
   - `'end'`: Aligns the element to the bottom of the scroll area.
   - `'nearest'`: Aligns the element to the nearest edge of the scroll area.

3. **inline** (Optional): Defines the horizontal alignment. Can be one of:
   - `'start'`: Aligns the element to the left of the scroll area.
   - `'center'`: Aligns the element to the center of the scroll area.
   - `'end'`: Aligns the element to the right of the scroll area.
   - `'nearest'` (default): Aligns the element to the nearest edge of the scroll area.

### Example

Here's how you can use `scrollIntoView` with options:

```javascript
// Scrolls the element into view with smooth scrolling and center alignment
element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'center'
});
```

### Detailed Example in Context

Let's integrate this into your use case, where you want to scroll to a new message element when it is created:

```javascript
// Example function to create and scroll into view
async function createAndScrollToMessage({ content, role, first }) {
    const messageElement = document.createElement('div');

    // Ensure 'first' is a boolean
    const isFirst = Boolean(first);

    // Add classes conditionally
    messageElement.classList.add('editable', 'message', role);
    if (isFirst) {
        messageElement.classList.add('first');
    }

    messageElement.textContent = content;

    // Append to the container (assuming branch is a container element)
    branch.appendChild(messageElement);

    // Scroll the new message into view
    messageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
    });

    return messageElement;
}

// Example usage
const branch = document.getElementById('branch-container');
createAndScrollToMessage({
    content: 'Hello, this is a new message!',
    role: 'user', // or 'bot'
    first: true // or false
});
```

### Explanation

1. **Creating and Appending the Element**:
   - A new `div` is created and assigned the appropriate classes based on the `role` and `first` values.
   - The `textContent` of the new element is set to the provided content.
   - The new element is appended to the container (`branch`).

2. **Scrolling into View**:
   - The `scrollIntoView` method is called with options to smoothly scroll the new element into view, aligning it to the start of the scroll area vertically and to the nearest edge horizontally.

This ensures that the new message element is smoothly scrolled into view, providing a better user experience.