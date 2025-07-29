console.log('Hello from TypeFlow!');

function greet(name: string): string {
  return `Hello, ${name}!`;
}

const message = greet('World');
console.log(message);

// Test live reload functionality
const timestamp = new Date().toISOString();
console.log(`Loaded at: ${timestamp}`);