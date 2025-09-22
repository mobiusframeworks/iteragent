# React Vite Example for IterAgent

This is a simple React + Vite application designed to demonstrate IterAgent's capabilities.

## Features

- **Counter Component**: Interactive counter with increment/decrement buttons
- **Error Handling**: Button to trigger test errors for IterAgent to detect
- **Multiple Routes**: Links to test different pages (including 404s)
- **Responsive Design**: Mobile-friendly layout
- **Accessibility**: Proper ARIA labels and semantic HTML

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Initialize IterAgent**:
   ```bash
   iteragent init
   ```

3. **Run IterAgent**:
   ```bash
   iteragent run
   ```

## What IterAgent Will Test

- **Server Startup**: Vite dev server starts successfully
- **Home Page**: Main app loads without errors
- **Counter Functionality**: Buttons work correctly
- **Error Scenarios**: Error button triggers proper error handling
- **Accessibility**: Checks for missing alt text, form labels, etc.
- **Performance**: Measures page load times
- **Console Errors**: Captures JavaScript errors

## Expected IterAgent Behavior

1. **Healthy State**: When everything works, IterAgent will report "healthy" status
2. **Error Detection**: When you click "Trigger Test Error", IterAgent will:
   - Detect the error in logs
   - Generate a fix request
   - Suggest improvements
3. **Continuous Monitoring**: IterAgent will keep running and detect changes

## Testing Different Scenarios

### Test Error Handling
Click the "Trigger Test Error" button to see how IterAgent handles errors.

### Test 404 Pages
Click the "404 Page" link to see how IterAgent handles missing routes.

### Test Performance
IterAgent will automatically measure page load times and report slow responses.

## Configuration

The `.iteragentrc.json` file is pre-configured for this example:

```json
{
  "port": 3000,
  "startCommand": "npm run dev",
  "routes": ["/", "/about", "/contact"],
  "logCaptureDuration": 5000,
  "testTimeout": 30000,
  "headless": true,
  "takeScreenshots": true
}
```

## Learn More

- [IterAgent Documentation](../README.md)
- [React Documentation](https://reactjs.org/)
- [Vite Documentation](https://vitejs.dev/)
