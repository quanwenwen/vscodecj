/* Copyright (c) Ben Robert Mewburn
 * Licensed under the ISC Licence.
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const intelephense_1 = require("intelephense");
// Create a connection for the server. The connection uses Node's IPC as a transport
let connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
let initialisedAt;
const languageId = 'php';
const discoverSymbolsRequest = new vscode_languageserver_1.RequestType('discoverSymbols');
const discoverReferencesRequest = new vscode_languageserver_1.RequestType('discoverReferences');
const forgetRequest = new vscode_languageserver_1.RequestType('forget');
const importSymbolRequest = new vscode_languageserver_1.RequestType('importSymbol');
const documentLanguageRangesRequest = new vscode_languageserver_1.RequestType('documentLanguageRanges');
const knownDocumentsRequest = new vscode_languageserver_1.RequestType('knownDocuments');
let config = {
    debug: {
        enable: false
    },
    completionProvider: {
        maxItems: 100,
        addUseDeclaration: true,
        backslashPrefix: true
    },
    diagnosticsProvider: {
        debounce: 1000,
        maxItems: 100
    },
    file: {
        maxSize: 1000000
    },
    formatProvider: {
        enable: true
    }
};
connection.onInitialize((params) => {
    initialisedAt = process.hrtime();
    connection.console.info('Initialising');
    let initOptions = {
        storagePath: params.initializationOptions.storagePath,
        logWriter: {
            info: connection.console.info,
            warn: connection.console.warn,
            error: connection.console.error
        },
        clearCache: params.initializationOptions.clearCache
    };
    return intelephense_1.Intelephense.initialise(initOptions).then(() => {
        intelephense_1.Intelephense.onPublishDiagnostics((args) => {
            connection.sendDiagnostics(args);
        });
        connection.console.info(`Initialised in ${elapsed(initialisedAt).toFixed()} ms`);
        return {
            capabilities: {
                textDocumentSync: vscode_languageserver_1.TextDocumentSyncKind.Incremental,
                documentSymbolProvider: true,
                workspaceSymbolProvider: true,
                completionProvider: {
                    triggerCharacters: ['$', '>', ':']
                },
                signatureHelpProvider: {
                    triggerCharacters: ['(', ',']
                },
                definitionProvider: true,
                //documentFormattingProvider: true,
                documentRangeFormattingProvider: false,
                referencesProvider: true,
                documentLinkProvider: { resolveProvider: false },
                hoverProvider: true,
                documentHighlightProvider: true
            }
        };
    });
});
let docFormatRegister = null;
connection.onDidChangeConfiguration((params) => {
    let settings = params.settings.intelephense;
    if (!settings) {
        return;
    }
    config = settings;
    intelephense_1.Intelephense.setConfig(config);
    let enableFormatter = config.formatProvider && config.formatProvider.enable;
    if (enableFormatter) {
        let documentSelector = [{ language: languageId, scheme: 'file' }];
        if (!docFormatRegister) {
            docFormatRegister = connection.client.register(vscode_languageserver_1.DocumentRangeFormattingRequest.type, { documentSelector });
        }
    }
    else {
        if (docFormatRegister) {
            docFormatRegister.then(r => r.dispose());
            docFormatRegister = null;
        }
    }
});
//atm for html compatibility
connection.onDocumentLinks((params) => {
    return [];
});
connection.onHover((params) => {
    return intelephense_1.Intelephense.provideHover(params.textDocument.uri, params.position);
});
connection.onDocumentHighlight((params) => {
    return intelephense_1.Intelephense.provideHighlights(params.textDocument.uri, params.position);
});
connection.onDidOpenTextDocument((params) => {
    if (params.textDocument.text.length > config.file.maxSize) {
        connection.console.warn(`${params.textDocument.uri} not opened -- over max file size.`);
        return;
    }
    handleRequest(() => {
        intelephense_1.Intelephense.openDocument(params.textDocument);
    }, ['onDidOpenTextDocument', params.textDocument.uri]);
});
connection.onDidChangeTextDocument((params) => {
    handleRequest(() => {
        intelephense_1.Intelephense.editDocument(params.textDocument, params.contentChanges);
    }, ['onDidChangeTextDocument', params.textDocument.uri]);
});
connection.onDidCloseTextDocument((params) => {
    handleRequest(() => {
        intelephense_1.Intelephense.closeDocument(params.textDocument);
    }, ['onDidCloseTextDocument', params.textDocument.uri]);
});
connection.onDocumentSymbol((params) => {
    let debugInfo = ['onDocumentSymbol', params.textDocument.uri];
    return handleRequest(() => {
        let symbols = intelephense_1.Intelephense.documentSymbols(params.textDocument);
        debugInfo.push(`${symbols.length} symbols`);
        return symbols;
    }, debugInfo);
});
connection.onWorkspaceSymbol((params) => {
    let debugInfo = ['onWorkspaceSymbol', params.query];
    return handleRequest(() => {
        let symbols = intelephense_1.Intelephense.workspaceSymbols(params.query);
        debugInfo.push(`${symbols.length} symbols`);
        return symbols;
    }, debugInfo);
});
connection.onReferences((params) => {
    let debugInfo = ['onReferences', params.textDocument.uri, JSON.stringify(params.position)];
    return handleRequest(() => {
        return intelephense_1.Intelephense.provideReferences(params.textDocument, params.position, params.context);
    }, debugInfo);
});
connection.onCompletion((params) => {
    let debugInfo = ['onCompletion', params.textDocument.uri, JSON.stringify(params.position)];
    return handleRequest(() => {
        let completions = intelephense_1.Intelephense.provideCompletions(params.textDocument, params.position);
        debugInfo.push(`${completions.items.length} items`);
        return completions;
    }, debugInfo);
});
connection.onSignatureHelp((params) => {
    let debugInfo = ['onSignatureHelp', params.textDocument.uri, JSON.stringify(params.position)];
    return handleRequest(() => {
        let sigHelp = intelephense_1.Intelephense.provideSignatureHelp(params.textDocument, params.position);
        debugInfo.push(`${sigHelp ? sigHelp.signatures.length : 0} signatures`);
        return sigHelp;
    }, debugInfo);
});
connection.onDefinition((params) => {
    let debugInfo = ['onDefinition', params.textDocument.uri, JSON.stringify(params.position)];
    return handleRequest(() => {
        return intelephense_1.Intelephense.provideDefinition(params.textDocument, params.position);
    }, debugInfo);
});
/*
connection.onDocumentFormatting((params) => {
    let debugInfo = ['onDocumentFormat', params.textDocument.uri];
    return handleRequest(() => {
        return Intelephense.provideDocumentFormattingEdits(params.textDocument, params.options);
    }, debugInfo);
});
*/
connection.onDocumentRangeFormatting((params) => {
    let debugInfo = ['onDocumentFormat', params.textDocument.uri];
    return handleRequest(() => {
        let r = intelephense_1.Intelephense.provideDocumentRangeFormattingEdits(params.textDocument, params.range, params.options);
        return r;
    }, debugInfo);
});
connection.onShutdown(intelephense_1.Intelephense.shutdown);
connection.onRequest(discoverSymbolsRequest, (params) => {
    if (params.textDocument.text.length > config.file.maxSize) {
        connection.console.warn(`${params.textDocument.uri} exceeds max file size.`);
        return 0;
    }
    let debugInfo = ['onDiscoverSymbols', params.textDocument.uri];
    return handleRequest(() => {
        let symbolCount = intelephense_1.Intelephense.discoverSymbols(params.textDocument);
        return symbolCount;
    }, debugInfo);
});
connection.onRequest(discoverReferencesRequest, (params) => {
    if (params.textDocument.text.length > config.file.maxSize) {
        connection.console.warn(`${params.textDocument.uri} exceeds max file size.`);
        return 0;
    }
    let debugInfo = ['onDiscoverReferences', params.textDocument.uri];
    return handleRequest(() => {
        let refCount = intelephense_1.Intelephense.discoverReferences(params.textDocument);
        return refCount;
    }, debugInfo);
});
connection.onRequest(forgetRequest, (params) => {
    let debugInfo = ['onForget', params.uri];
    return handleRequest(() => {
        let nForgot = intelephense_1.Intelephense.forget(params.uri);
        debugInfo.push(`${nForgot} symbols`);
        return nForgot;
    }, debugInfo);
});
connection.onRequest(importSymbolRequest, (params) => {
    let debugInfo = ['onImportSymbol', params.uri];
    return handleRequest(() => {
        return intelephense_1.Intelephense.provideContractFqnTextEdits(params.uri, params.position, params.alias);
    }, debugInfo);
});
connection.onRequest(knownDocumentsRequest, () => {
    let debugInfo = ['onCachedDocument'];
    return handleRequest(() => {
        return intelephense_1.Intelephense.knownDocuments();
    }, debugInfo);
});
connection.onRequest(documentLanguageRangesRequest, (params) => {
    let debugInfo = ['onDocumentLanguageRanges'];
    return handleRequest(() => {
        return intelephense_1.Intelephense.documentLanguageRanges(params.textDocument);
    }, debugInfo);
});
// Listen on the connection
connection.listen();
function handleRequest(handler, debugMsgArray) {
    try {
        let start = process.hrtime();
        let t = handler();
        let snap = takeProcessSnapshot(start);
        debugMsgArray.push(`${snap.elapsed.toFixed(3)} ms`, `${snap.memory.toFixed(1)} MB`);
        debug(debugMsgArray.join(' | '));
        return t;
    }
    catch (err) {
        connection.console.error(debugMsgArray.join(' | ') + '\n' + err.stack);
        return null;
    }
}
function debug(msg) {
    if (config.debug.enable) {
        connection.console.log(`[Debug - ${timeString()}] ${msg}`);
    }
}
function timeString() {
    let time = new Date();
    return time.toLocaleString(undefined, { hour: 'numeric', minute: 'numeric', second: 'numeric' });
}
function takeProcessSnapshot(hrtimeStart) {
    return {
        elapsed: elapsed(hrtimeStart),
        memory: memory()
    };
}
function elapsed(start) {
    if (!start) {
        return -1;
    }
    let diff = process.hrtime(start);
    return diff[0] * 1000 + diff[1] / 1000000;
}
function memory() {
    return process.memoryUsage().heapUsed / 1000000;
}
//# sourceMappingURL=server.js.map