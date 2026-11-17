(() => {
  'use strict';
  const native = window.HeadOnNative;
  const connected = !!native && typeof native.getState === 'function';
  const channels = ['stable', 'lab'];
  const busyStatuses = new Set(['checking', 'downloading', 'installing']);
  const labels = { idle: '준비됨', checking: '확인 중', available: '업데이트 있음', downloading: '다운로드 중', installing: '설치 중', error: '확인 필요' };
  let current = null;
  let actionPending = false;

  const $ = id => document.getElementById(id);
  const text = (node, value) => { node.textContent = value; };
  const finite = value => Number.isFinite(Number(value)) && Number(value) >= 0;
  const count = value => finite(value) ? Math.floor(Number(value)) : 0;
  const shortSha = value => typeof value === 'string' && /^[a-f0-9]{7,64}$/i.test(value) ? value.slice(0, 8) : '—';
  const version = value => value === undefined || value === null || value === '' ? '버전 정보 없음' : String(value);
  const size = value => {
    if (!finite(value)) return '용량 확인 중';
    const bytes = Number(value);
    if (bytes < 1024) return Math.round(bytes) + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1048576).toFixed(bytes >= 10485760 ? 0 : 1) + ' MB';
  };
  const buildDate = value => {
    const date = new Date(value);
    if (!value || !Number.isFinite(date.getTime())) return '게임과 자산이 함께 관리됩니다.';
    return '빌드 ' + new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  };
  function report(message) { text($('notice'), String(message || '').slice(0, 300)); }
  function setConnection(state) {
    const node = $('connection');
    const online = typeof state?.online === 'boolean' ? state.online : navigator.onLine;
    node.classList.toggle('offline', connected && !online);
    node.classList.toggle('unavailable', !connected);
    text(node, !connected ? '앱 연결 없음' : online ? '네트워크 연결' : '오프라인');
    text($('storage-note'), connected && !online
      ? '설치된 게임은 오프라인에서도 실행할 수 있습니다.'
      : '자산은 기기에서, 기록과 업데이트는 서버와 연결됩니다.');
  }
  function renderChannel(name, row, state, busy) {
    const card = document.querySelector('[data-channel="' + name + '"]');
    const field = key => card.querySelector('[data-field="' + key + '"]');
    const action = key => card.querySelector('[data-action="' + key + '"]');
    const installed = row?.installed || null;
    const candidate = row?.candidate || null;
    const status = row?.status || 'idle';
    const inProgress = busyStatuses.has(status);
    const online = typeof state?.online === 'boolean' ? state.online : navigator.onLine;
    const hasUpdate = !!candidate && (!installed || candidate.sourceSha !== installed.sourceSha || candidate.version !== installed.version);
    const appCompatible = !candidate || !finite(candidate.minimumAppVersion) || Number(candidate.minimumAppVersion) <= Number(state?.appVersion || 0);
    text(field('status'), !connected ? '앱 연결 필요' : inProgress ? labels[status] : status === 'error' ? labels.error : hasUpdate ? labels.available : installed ? '준비됨' : '설치 필요');
    field('status').dataset.state = status === 'error' ? 'error' : hasUpdate ? 'available' : status;
    text(field('version'), installed ? version(installed.version) : connected ? '아직 설치되지 않음' : '—');
    field('version').title = installed ? version(installed.version) : '';
    text(field('sha'), shortSha(installed?.sourceSha));
    field('sha').title = installed?.sourceSha || '';
    text(field('date'), installed ? buildDate(installed.createdAt) : connected ? '업데이트 확인 후 게임을 설치하세요.' : 'Android 앱에서 상태를 확인할 수 있습니다.');
    action('launch').disabled = !connected || !installed || busy || actionPending;
    action('check').disabled = !connected || !online || busy || actionPending;
    text(action('check'), status === 'checking' ? '확인 중…' : '업데이트 확인');
    field('update').hidden = !hasUpdate || status === 'downloading' || status === 'installing';
    if (hasUpdate) {
      text(field('update-title'), (installed ? '새 버전 · ' : '설치 가능 · ') + version(candidate.version));
      text(field('update-sha'), shortSha(candidate.sourceSha));
      field('update-sha').title = candidate.sourceSha || '';
      const download = finite(candidate.downloadBytes)
        ? '예상 다운로드 ' + size(candidate.downloadBytes) + (finite(candidate.downloadFiles) ? ' · ' + count(candidate.downloadFiles) + '개 파일' : '')
        : '전체 패키지 ' + size(candidate.totalBytes);
      text(field('update-details'), appCompatible ? download : '앱 ' + candidate.minimumAppVersion + ' 이상에서 설치할 수 있습니다. APK를 먼저 업데이트하세요.');
      text(action('install'), installed ? '업데이트 설치' : '게임 설치');
      action('install').disabled = !connected || !online || !appCompatible || busy || actionPending;
    }
    field('progress-panel').hidden = !inProgress;
    if (inProgress) {
      const progress = card.querySelector('progress');
      const actual = finite(row?.progress) ? Math.max(0, Math.min(1, Number(row.progress))) : null;
      text(field('progress-label'), status === 'checking' ? '새 버전 확인 중' : status === 'installing' ? '파일 검증 및 설치 중' : '게임 파일 다운로드 중');
      if (status === 'downloading' && finite(row?.totalBytes) && Number(row.totalBytes) > 0) {
        progress.value = actual === null ? Math.min(1, count(row.downloadedBytes) / Number(row.totalBytes)) : actual;
        text(field('progress-count'), Math.floor(progress.value * 100) + '%');
        text(field('progress-detail'), size(row.downloadedBytes || 0) + ' / ' + size(row.totalBytes));
      } else {
        progress.removeAttribute('value');
        text(field('progress-count'), '');
        text(field('progress-detail'), status === 'checking' ? '서버에 게시된 패키지를 확인하고 있습니다.' : '확인이 끝나면 새 버전으로 전환됩니다.');
      }
    }
    const error = row?.error ? String(row.error).slice(0, 300) : '';
    field('error').hidden = !error;
    text(field('error'), error);
    action('rollback').hidden = !row?.canRollback;
    action('rollback').disabled = !connected || busy || actionPending;
  }
  function render(state) {
    if (state && typeof state === 'object') current = state;
    const value = current || {};
    const busy = channels.some(name => busyStatuses.has(value.channels?.[name]?.status));
    setConnection(value);
    for (const name of channels) renderChannel(name, value.channels?.[name], value, busy);
    const pending = count(value.queue?.pending);
    const rejected = count(value.queue?.rejected);
    text($('queue-count'), !connected ? '—' : pending ? '전송 대기 ' + pending + '건' : rejected ? '확인 필요 ' + rejected + '건' : '대기 기록 없음');
    text($('queue-description'), !connected
      ? 'Android 앱에서 실제 전송 상태를 확인할 수 있습니다.'
      : pending ? '기록은 기기에 보관되어 있습니다. 연결되면 서버로 다시 전송합니다.'
      : '본섭 기록만 공식 랭킹에 전송됩니다. 테스트 기록은 분리됩니다.');
    const queueError = rejected
      ? '서버가 받지 않은 기록 ' + rejected + '건이 있습니다.' + (value.queue?.lastError ? ' ' + String(value.queue.lastError) : '')
      : value.queue?.lastError ? String(value.queue.lastError) : '';
    $('queue-error').hidden = !queueError;
    text($('queue-error'), queueError.slice(0, 300));
    text($('app-version'), connected && value.appVersion !== undefined ? 'HEAD-ON · APP ' + value.appVersion : 'HEAD-ON');
  }
  function readState() {
    if (!connected) { render(); return; }
    try {
      const raw = native.getState();
      const state = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!state || typeof state !== 'object' || !state.channels) throw new Error('앱 상태를 읽지 못했습니다.');
      render(state);
    } catch (error) { report(error.message || '앱 상태를 읽지 못했습니다.'); render(); }
  }
  window.__headonNativeEvent = payload => {
    try {
      const event = typeof payload === 'string' ? JSON.parse(payload) : payload;
      if (!event || typeof event !== 'object') return;
      actionPending = false;
      if (event.channels) render(event);
      else readState();
      if (event.message) report(event.message);
    } catch (_) { report('업데이트 상태를 읽지 못했습니다. 앱을 다시 열어 확인하세요.'); }
  };
  for (const card of document.querySelectorAll('[data-channel]')) {
    card.addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button || button.disabled || !connected) return;
      const name = card.dataset.channel;
      const method = { launch: 'launch', check: 'checkUpdates', install: 'installUpdate', rollback: 'rollback' }[button.dataset.action];
      if (!method || !channels.includes(name)) return;
      try {
        if (typeof native[method] !== 'function') throw new Error('이 앱 버전에서 지원하지 않는 기능입니다.');
        actionPending = true;
        report('');
        render();
        native[method](name);
        // A synchronous getState reflects real native state; no optimistic success.
        actionPending = false;
        readState();
      } catch (error) {
        actionPending = false;
        report(error.message || '요청을 처리하지 못했습니다.');
        render();
      }
    });
  }
  if (!connected || window.__HEADON_SHELL_QA__ === true) {
    $('preview-note').hidden = false;
    if (window.__HEADON_SHELL_QA__ === true) {
      text($('preview-title'), '화면 검증용 샘플');
      text($('preview-copy'), '이 화면의 데이터는 UI 검증용입니다. 실제 앱 설치·전송·업데이트 결과가 아닙니다.');
    }
  }
  window.addEventListener('online', readState);
  window.addEventListener('offline', readState);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) readState(); });
  readState();
})();
