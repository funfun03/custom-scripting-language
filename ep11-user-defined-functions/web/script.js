// Initialize CodeMirror
let editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
    lineNumbers: true,
    mode: 'javascript',
    theme: 'dracula',
    indentUnit: 4,
    indentWithTabs: false,
    tabSize: 4,
    autoCloseBrackets: true,
    matchBrackets: true,
    lineWrapping: true
});

// Sample code snippets
const samples = {
    'simple-expression': '// Simple expression example\n5 + 10;\n\n// Variable assignment\nx = 20;\n\n// Expression with variable\nx + 15;',
    'print-example': '// Print statement examples\nprint(42);\nprint("Hello, world!");\nprint(5 + 10);\n\n// Variable with print\nx = 100;\nprint(x);\nprint(x * 2);',
    'if-statement': '// If statement example\nif (8 > 0) {\n    print("True")\n} else {\n    print("False")\n}'
};

// Set up parser selector
const parserOptions = document.querySelectorAll('.parser-option');
parserOptions.forEach(option => {
    option.addEventListener('click', () => {
        // Remove active class from all options
        parserOptions.forEach(opt => opt.classList.remove('active'));
        // Add active class to clicked option
        option.classList.add('active');
        // Update hidden input value
        document.getElementById('parser-type').value = option.getAttribute('data-value');
    });
});

// Set up buttons
document.getElementById('run-button').addEventListener('click', runCode);
document.getElementById('load-sample-1').addEventListener('click', () => loadSample('simple-expression'));
document.getElementById('load-sample-2').addEventListener('click', () => loadSample('print-example'));
document.getElementById('load-sample-3').addEventListener('click', () => loadSample('if-statement'));

// Load a sample into the editor
function loadSample(sampleName) {
    // Add fade out/in effect
    const editorElement = editor.getWrapperElement();
    editorElement.style.opacity = 0.5;
    
    setTimeout(() => {
        editor.setValue(samples[sampleName]);
        editor.refresh();
        
        // Animate back in
        editorElement.style.opacity = 1;
        
        // Add a little delay and then focus the editor
        setTimeout(() => editor.focus(), 300);
    }, 200);
}

// Run button animation
function animateRunButton() {
    const runButton = document.getElementById('run-button');
    runButton.classList.add('pulse');
    runButton.disabled = true;
    runButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Running...';
    
    setTimeout(() => {
        runButton.classList.remove('pulse');
        runButton.disabled = false;
        runButton.innerHTML = '<i class="fas fa-play me-2"></i> Run Code';
    }, 1500);
}

// Run the code
async function runCode() {
    const code = editor.getValue();
    const parserType = document.getElementById('parser-type').value;
    
    // Animate the run button
    animateRunButton();
    
    // Clear output containers and show loading
    document.getElementById('output-container').innerHTML = '<div class="text-secondary"><i class="fas fa-spinner fa-spin me-2"></i> Running code...</div>';
    document.getElementById('ast-container').innerHTML = '<div class="text-secondary"><i class="fas fa-spinner fa-spin me-2"></i> Generating AST...</div>';
    
    try {
        const response = await fetch('/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: code,
                parserType: parserType
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Display output with a slight delay for better UX
        setTimeout(() => {
            // Display output
            document.getElementById('output-container').innerHTML = formatOutput(result.output);
            
            // Display AST
            const astContainer = document.getElementById('ast-container');
            astContainer.innerHTML = `<pre>${JSON.stringify(result.ast, null, 2)}</pre>`;
            
            // Highlight AST tab to show there's new content
            if (!document.getElementById('ast-tab').classList.contains('active')) {
                document.getElementById('ast-tab').classList.add('text-primary');
                
                // Remove highlight when tab is clicked
                document.getElementById('ast-tab').addEventListener('click', function onceListener() {
                    this.classList.remove('text-primary');
                    this.removeEventListener('click', onceListener);
                });
            }
        }, 500);
        
    } catch (error) {
        document.getElementById('output-container').innerHTML = 
            `<div class="text-danger"><i class="fas fa-exclamation-triangle me-2"></i> Error: ${error.message}</div>`;
        document.getElementById('ast-container').innerHTML = 
            `<div class="text-danger"><i class="fas fa-exclamation-triangle me-2"></i> AST generation failed</div>`;
    }
}

// Format the console output with syntax highlighting
function formatOutput(output) {
    if (!output) return '<div class="text-secondary">No output.</div>';
    
    // Replace console.log output with formatted HTML
    const lines = output.split('\n');
    let formattedOutput = '';
    
    for (const line of lines) {
        if (line.trim() === '') {
            formattedOutput += '<br>';
        } else if (line.includes('Error:')) {
            formattedOutput += `<div class="text-danger"><i class="fas fa-exclamation-triangle me-2"></i>${escapeHtml(line)}</div>`;
        } else if (line.includes('Using parser:')) {
            formattedOutput += `<div class="text-primary"><i class="fas fa-info-circle me-2"></i>${escapeHtml(line)}</div>`;
        } else if (line.includes('Source code:')) {
            formattedOutput += `<div class="text-primary"><i class="fas fa-code me-2"></i>${escapeHtml(line)}</div>`;
        } else if (line.includes('Running program:')) {
            formattedOutput += `<div class="text-primary"><i class="fas fa-play-circle me-2"></i>${escapeHtml(line)}</div>`;
        } else if (line.includes('AST generated:')) {
            formattedOutput += `<div class="text-primary"><i class="fas fa-project-diagram me-2"></i>${escapeHtml(line)}</div>`;
        } else if (line.includes('Result:')) {
            formattedOutput += `<div class="text-success"><i class="fas fa-check-circle me-2"></i>${escapeHtml(line)}</div>`;
        } else {
            formattedOutput += `<div class="text-output">${escapeHtml(line)}</div>`;
        }
    }
    
    return formattedOutput;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add keyboard shortcut for running code
document.addEventListener('keydown', function(e) {
    // Check if Ctrl+Enter or Cmd+Enter is pressed
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
    }
});

// Add a tooltip message for keyboard shortcut
const runButton = document.getElementById('run-button');
runButton.setAttribute('title', 'Run Code (Ctrl+Enter)');

// Initialize with a sample
loadSample('print-example');

// Show a welcome message
document.getElementById('output-container').innerHTML = `
<div class="text-secondary">
    <i class="fas fa-info-circle me-2"></i> Welcome to the Custom Scripting Language Playground!
    <br><br>
    <ul>
        <li>Write your code in the editor or select a sample</li>
        <li>Choose a parser algorithm (Recursive Descent or LL(1))</li>
        <li>Click "Run Code" or press Ctrl+Enter to execute</li>
        <li>View the output and generated Abstract Syntax Tree</li>
    </ul>
</div>
`; 