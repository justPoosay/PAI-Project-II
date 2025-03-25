# Creating a Route in the File System Router

## Overview

The server uses a file system-based routing mechanism, where each file in the `app` directory corresponds to a route.
The router matches incoming requests to these files based on the URL path.

## Steps to Create a Route

1. **File Naming**:

- The name of the file should correspond to the desired route path. For example, a file named `hello.js` will match the
  `/hello` route.

2. **Exporting Methods**:

- Each file should export HTTP method functions (e.g., `GET`, `POST`, `PUT`, `DELETE`) that correspond to the HTTP
  methods you want to handle for that route.
- Example:

  ```javascript
  export async function GET(req) {
    return new Response('Hello, GET!');
  }

  export async function POST(req) {
    return new Response('Hello, POST!');
  }
  ```

3. **Pre-processing with `pre` Method**:

- Optionally, export a `pre` function to perform any pre-processing before the main method is executed.
- The `pre` function should return a `Response` object if it wants to handle the request directly, or `null` to continue
  to the main method.
- Example:
  ```javascript
  export async function pre(req) {
    // Perform some checks or modifications
    if (someCondition) {
      return new Response('Pre-condition failed', { status: 400 });
    }
    return null; // Continue to the main method
  }
  ```

4. **Handling Responses**:

- Ensure that your method functions return a `Response` object. If a method does not return a `Response`, the server
  will respond with a 404 error.

5. **Error Handling**:

- If a route is not found or a method is not defined, the server will automatically return a JSON response with a 404
  status:
  ```json
  { "success": false, "error": "Not Found" }
  ```

## Example

To create a simple route that responds to GET requests at `/greet`, create a file named `greet.js` in the `app`
directory with the following content:

```javascript
export async function GET(req) {
  return new Response('Hello, World!');
}
```

This setup will ensure that when a GET request is made to `/greet`, the server responds with "Hello, World!".

By following these steps, you can easily add new routes to your server using the file system-based routing approach.
