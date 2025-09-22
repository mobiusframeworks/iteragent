const vscode = require('vscode');

function activate(context) {
    console.log('IterAgent extension activated');
    
    // Register commands
    const startCommand = vscode.commands.registerCommand('iteragent.start', () => {
        const terminal = vscode.window.createTerminal('IterAgent');
        terminal.sendText('iteragent run');
        terminal.show();
    });
    
    const stopCommand = vscode.commands.registerCommand('iteragent.stop', () => {
        vscode.window.showInformationMessage('IterAgent stopped');
    });
    
    const statusCommand = vscode.commands.registerCommand('iteragent.status', () => {
        const terminal = vscode.window.createTerminal('IterAgent Status');
        terminal.sendText('iteragent feedback --status');
        terminal.show();
    });
    
    context.subscriptions.push(startCommand, stopCommand, statusCommand);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
