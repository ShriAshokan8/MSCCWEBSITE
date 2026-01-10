const DEFAULT_FILES = [
    {
        id: crypto.randomUUID(),
        name: 'index.html',
        language: 'html',
        content: `<!doctype html>
<html>
  <head>
    <title>MSC Vertex</title>
  </head>
  <body>
    <main>
      <h1>Welcome to MSC Vertex</h1>
      <p>Edit the files, click Run, and view the preview on the right.</p>
      <div id="app"></div>
    </main>
  </body>
</html>`,
    },
    {
        id: crypto.randomUUID(),
        name: 'style.css',
        language: 'css',
        content: `body { font-family: Poppins, system-ui, sans-serif; padding: 24px; }
h1 { color: #ff6b35; }
p { color: #444; }`,
    },
    {
        id: crypto.randomUUID(),
        name: 'script.js',
        language: 'javascript',
        content: `const message = 'Hello from MSC Vertex!';
document.querySelector('#app').textContent = message;`,
    },
    {
        id: crypto.randomUUID(),
        name: 'main.py',
        language: 'python',
        content: `# Python execution happens in a sandboxed environment.
print("Welcome to MSC Vertex!")
for i in range(3):
    print("Line", i + 1)`,
    },
];

const BANNED_IMPORTS = [
    'os', 'sys', 'subprocess', 'socket', 'shutil', 'pathlib', 'requests', 'psutil',
    'urllib', 'http', 'ftplib', 'smtplib', 'telnetlib', 'webbrowser', 'importlib',
    '__import__', 'eval', 'exec', 'open', 'input', 'raw_input', 'file'
];
const PY_TIMEOUT_MS = 4500;

const $ = (id) => document.getElementById(id);

const state = {
    files: [],
    activeFileId: null,
    editor: null,
    role: 'student',
    userId: 'guest',
    submitted: false,
    dirty: false,
    saveTimer: null,
    workerHandle: null,
};

function deriveUserContext() {
    const contextUser = window.mscAuth?.user || window.mscAuth || window.currentUser || window.mscUser;
    const userId = contextUser?.id || contextUser?.uid || 'guest';
    const roleSource = contextUser?.role ?? contextUser?.claims?.role ?? document.body.dataset.role ?? 'student';
    const normalizedRole = ['student', 'staff', 'admin'].includes(String(roleSource).toLowerCase())
        ? String(roleSource).toLowerCase()
        : 'student';
    state.role = normalizedRole;
    state.userId = userId;
    const badge = $('vertexRoleBadge');
    if (badge) {
        const label = normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1);
        badge.textContent = `Role: ${label}`;
    }
}

function loadProject() {
    const projectName = $('vertexProjectName').value.trim() || 'My Vertex Project';
    const savedRaw = localStorage.getItem(projectStorageKey(projectName));
    if (savedRaw) {
        try {
            const parsed = JSON.parse(savedRaw);
            state.files = parsed.files || DEFAULT_FILES.map(cloneFile);
            state.submitted = Boolean(parsed.submitted);
            state.activeFileId = parsed.activeFileId || state.files[0].id;
            updateTimestamp(parsed.lastEdited);
            return;
        } catch (err) {
            console.error('Failed to parse saved project, resetting', err);
        }
    }
    state.files = DEFAULT_FILES.map(cloneFile);
    state.activeFileId = state.files[0].id;
    state.submitted = false;
    updateTimestamp();
}

function projectStorageKey(name) {
    return `mscVertex:${state.userId}:${name}`;
}

function cloneFile(file) {
    return { ...file, id: crypto.randomUUID() };
}

function saveProject(manual = false) {
    if (state.submitted) return;
    const projectName = $('vertexProjectName').value.trim() || 'My Vertex Project';
    const payload = {
        files: state.files,
        activeFileId: state.activeFileId,
        lastEdited: Date.now(),
        submitted: state.submitted,
    };
    localStorage.setItem(projectStorageKey(projectName), JSON.stringify(payload));
    updateTimestamp(payload.lastEdited);
    setSaveState(manual ? 'Saved' : 'Auto-saved');
    state.dirty = false;
}

function debounceSave() {
    if (state.saveTimer) clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(() => saveProject(false), 1200);
}

function setSaveState(text) {
    const el = $('vertexSaveState');
    if (el) {
        el.textContent = text;
        el.classList.toggle('subtle', text.toLowerCase().includes('unsaved'));
    }
}

function updateTimestamp(ts = Date.now()) {
    const el = $('vertexTimestamp');
    if (!el) return;
    const formatter = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    el.textContent = `Last edited: ${formatter.format(ts)}`;
}

function renderFileExplorer() {
    const list = $('vertexFileList');
    if (!list) return;
    list.innerHTML = '';
    const tpl = $('vertex-file-row-template');
    state.files.forEach((file) => {
        const row = tpl.content.firstElementChild.cloneNode(true);
        const btn = row.querySelector('.vertex-file-btn');
        const meta = row.querySelector('.vertex-file-meta');
        btn.textContent = file.name;
        btn.classList.toggle('active', file.id === state.activeFileId);
        btn.addEventListener('click', () => setActiveFile(file.id));
        meta.textContent = file.language.toUpperCase();
        if (state.submitted) {
            btn.disabled = true;
        }
        list.appendChild(row);
    });
}

function renderTabs() {
    const tabs = $('vertexTabs');
    if (!tabs) return;
    tabs.innerHTML = '';
    state.files.forEach((file) => {
        const tab = document.createElement('button');
        tab.className = 'vertex-tab';
        tab.role = 'tab';
        tab.setAttribute('aria-selected', file.id === state.activeFileId ? 'true' : 'false');
        tab.classList.toggle('active', file.id === state.activeFileId);
        const nameSpan = document.createElement('span');
        nameSpan.textContent = file.name;
        const langSpan = document.createElement('span');
        langSpan.className = 'lang';
        langSpan.textContent = file.language;
        tab.append(nameSpan, langSpan);
        tab.addEventListener('click', () => setActiveFile(file.id));
        if (state.submitted) tab.disabled = true;
        tabs.appendChild(tab);
    });
}

function setActiveFile(id) {
    state.activeFileId = id;
    renderFileExplorer();
    renderTabs();
    const file = state.files.find((f) => f.id === id);
    if (file && state.editor) {
        state.editor.setValue(file.content);
        monaco.editor.setModelLanguage(state.editor.getModel(), mapLanguage(file.language));
        state.editor.updateOptions({ readOnly: state.submitted });
    }
}

function mapLanguage(language) {
    if (language === 'javascript') return 'javascript';
    if (language === 'python') return 'python';
    if (language === 'css') return 'css';
    return 'html';
}

function initMonaco() {
    const run = () => {
        const monacoRequire = window.require;
        if (!monacoRequire || !monacoRequire.config) return;
        monacoRequire.config({
            paths: {
                vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.47.0/min/vs',
            },
        });
        monacoRequire(['vs/editor/editor.main'], () => {
            const activeFile = state.files.find((f) => f.id === state.activeFileId) || state.files[0];
            state.editor = monaco.editor.create($('vertexEditor'), {
                value: activeFile.content,
                language: mapLanguage(activeFile.language),
                automaticLayout: true,
                fontSize: 14,
                theme: 'vs',
                minimap: { enabled: false },
            });
            state.editor.onDidChangeModelContent(() => {
                if (state.submitted) {
                    state.editor.setValue(activeFile.content);
                    return;
                }
                activeFile.content = state.editor.getValue();
                state.dirty = true;
                setSaveState('Unsaved changes');
                debounceSave();
            });
        });
    };
    if (window.require) {
        run();
    } else {
        const loader = document.getElementById('monaco-loader');
        loader.addEventListener('load', run, { once: true });
    }
}

function addFile() {
    if (state.submitted) return;
    const name = prompt('Enter file name (e.g. newFile.js):');
    if (!name) return;
    const lower = name.toLowerCase();
    let language = 'javascript';
    if (lower.endsWith('.py')) language = 'python';
    else if (lower.endsWith('.css')) language = 'css';
    else if (lower.endsWith('.html')) language = 'html';
    const newFile = { id: crypto.randomUUID(), name, language, content: '' };
    state.files.push(newFile);
    setActiveFile(newFile.id);
    renderFileExplorer();
    renderTabs();
    saveProject(true);
}

function setOutputMode(mode) {
    const preview = $('vertexPreview');
    const consoleEl = $('vertexConsole');
    if (mode === 'console') {
        consoleEl.hidden = false;
        preview.style.display = 'none';
    } else {
        consoleEl.hidden = true;
        preview.style.display = 'block';
    }
}

function buildHtmlOutput() {
    const html = state.files.find((f) => f.language === 'html')?.content || '';
    const css = state.files.find((f) => f.language === 'css')?.content || '';
    const js = state.files.find((f) => f.language === 'javascript')?.content || '';
    return `<!doctype html><html><head><style>${css}</style></head><body>${html}<script>${js}</script></body></html>`;
}

function runHtmlPreview() {
    const iframe = $('vertexPreview');
    setOutputMode('live');
    iframe.srcdoc = buildHtmlOutput();
    setExecutionLog('Rendered HTML/CSS/JS in preview.');
    logExecution('client', 'html');
}

function pythonRunner() {
    const createWorker = () => {
        const blob = new Blob([`
            const banned = ${JSON.stringify(BANNED_IMPORTS)};
            self.importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js');
            let pyReady = loadPyodide({indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'});
            self.postMessage({type: 'ready'});
            self.onmessage = async (event) => {
                const { code } = event.data;
                const bannedPattern = new RegExp('\\\\b(' + banned.join('|') + ')\\\\b', 'i');
                if (bannedPattern.test(code)) {
                    self.postMessage({ type: 'error', data: { error: 'Unsafe import detected.' } });
                    return;
                }
                try {
                    const pyodide = await pyReady;
                    let stdout = '';
                    let stderr = '';
                    pyodide.setStdout({ batched: (s) => { stdout += s; } });
                    pyodide.setStderr({ batched: (s) => { stderr += s; } });
                    await pyodide.runPythonAsync(code);
                    self.postMessage({ type: 'result', data: { stdout, stderr } });
                } catch (err) {
                    self.postMessage({ type: 'error', data: { error: err && err.message ? err.message : String(err) } });
                }
            };
        `], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);
        return { worker, url };
    };

        const ensureWorker = () => {
            if (!state.workerHandle) {
                state.workerHandle = createWorker();
            }
            return state.workerHandle;
        };

        const cleanupWorker = () => {
            if (state.workerHandle) {
                state.workerHandle.worker.terminate();
                URL.revokeObjectURL(state.workerHandle.url);
                state.workerHandle = null;
            }
        };

        return async function run(code) {
            const { worker } = ensureWorker();
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    cleanupWorker();
                    reject(new Error('Execution timed out'));
                }, PY_TIMEOUT_MS);

                worker.onmessage = (event) => {
                    const { type, data } = event.data;
                if (type === 'ready') return;
                clearTimeout(timeout);
                if (type === 'result') {
                    resolve({ stdout: data.stdout, stderr: data.stderr });
                } else if (type === 'error') {
                    reject(new Error(data.error || 'Failed to run code'));
                }
            };

                worker.onerror = (err) => {
                    clearTimeout(timeout);
                    cleanupWorker();
                    reject(err);
                };

            worker.postMessage({ code });
        });
    };
}

const runPythonCode = pythonRunner();

async function handlePythonRun(file) {
        setExecutionLog('Running Python securely...');
        setOutputMode('console');
        const consoleEl = $('vertexConsole');
        consoleEl.textContent = '';
        try {
            const result = await runPythonCode(file.content);
            const out = (result.stdout || '').trim();
            const err = (result.stderr || '').trim();
            if (err && state.role === 'student') {
                consoleEl.textContent = 'Your code did not run successfully. Review your logic.';
            } else if (err) {
                consoleEl.textContent = `${out}\n${err}`.trim();
            } else {
                consoleEl.textContent = out || 'Execution finished with no output.';
            }
            setExecutionLog('Python run completed.');
            logExecution('sandbox', 'python', err ? 'error' : 'ok');
        } catch (err) {
            if (state.role === 'student') {
                consoleEl.textContent = 'Your code did not run successfully. Review your logic.';
            } else {
                consoleEl.textContent = err.message;
            }
            setExecutionLog('Python run failed.');
            logExecution('sandbox', 'python', 'error');
        }
}

async function runCurrentFile() {
    const file = state.files.find((f) => f.id === state.activeFileId) || state.files[0];
    if (!file) return;
    if (file.language === 'python') return handlePythonRun(file);
    runHtmlPreview();
}

function setExecutionLog(text) {
    const el = $('vertexExecutionLog');
    if (el) el.textContent = text;
}

function logExecution(channel, language, status = 'ok') {
    const record = {
        at: Date.now(),
        channel,
        language,
        status,
        user: state.userId,
    };
    const existing = JSON.parse(localStorage.getItem('mscVertex:execLog') || '[]');
    existing.push(record);
    localStorage.setItem('mscVertex:execLog', JSON.stringify(existing.slice(-50)));
}

function submitProject() {
    state.submitted = true;
    if (state.editor) state.editor.updateOptions({ readOnly: true });
    $('vertexSaveBtn').disabled = true;
    $('vertexAddFileBtn').disabled = true;
    setSaveState('Submitted (read-only)');
    saveProject(true);
}

function wireEvents() {
    $('vertexAddFileBtn').addEventListener('click', addFile);
    $('vertexSaveBtn').addEventListener('click', () => saveProject(true));
    $('vertexRunBtn').addEventListener('click', runCurrentFile);
    $('vertexSubmitBtn').addEventListener('click', submitProject);
    $('vertexOutputMode').addEventListener('change', (e) => setOutputMode(e.target.value));
    $('vertexProjectName').addEventListener('change', () => {
        loadProject();
        renderFileExplorer();
        renderTabs();
        setActiveFile(state.activeFileId);
    });
}

function bootstrap() {
    deriveUserContext();
    loadProject();
    renderFileExplorer();
    renderTabs();
    initMonaco();
    wireEvents();
    setActiveFile(state.activeFileId);
    setSaveState('Ready');
}

document.addEventListener('DOMContentLoaded', bootstrap);
/* global monaco, require */
