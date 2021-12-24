import { ipcRenderer, shell } from 'electron';
import remote from '@electron/remote';
import { Button, Divider } from 'antd';

const AppUrl = 'https://github.com/njzydark/Aragorn';

export const About = () => {
  function handleUpdate() {
    ipcRenderer.send('check-update', true);
  }

  return (
    <div className="info-wrapper">
      <header>
        <span>关于</span>
        <Divider />
      </header>
      <main>
        <h3>Aragorn</h3>
        <a
          style={{ margin: 10 }}
          onClick={() => {
            shell.openExternal(AppUrl);
          }}
        >
          {AppUrl}
        </a>
        <p className="desc">v{remote && remote.app && remote.app.getVersion() || '未知版本'}</p>
        <Button type="primary" onClick={handleUpdate}>
          检查更新
        </Button>
      </main>
    </div>
  );
};
