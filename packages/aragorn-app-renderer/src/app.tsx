import { HashRouter, Route } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';
import { routes } from './routes';
import { SideBar } from '@renderer/components/SideBar';
import { WindowButton } from '@renderer/components/WindowButton';
import { useAppStateHandle, useAppUpdateHandle, useFileDownloadHandle } from '@renderer/hook/useIpcRendererHandle';
import { usePlatform } from '@renderer/hook/usePlatform';
import lightTheme from './style/light.lazy.less';
import { AxiosProvider } from 'react-axios'
import axios from 'axios';
import { get } from 'lodash';
import { applyAuthTokenInterceptor, clearAuthTokens, setAuthTokens } from 'axios-jwt';
import { message as MessageBox } from 'antd';



lightTheme.use();
export const isDev = process.env.NODE_ENV === 'development'
export const BASE_URL = isDev ? 'http://localhost:3000' : 'http://localhost:3000'
const config = {}
const isLoginAPI = (url = '') => {
  return /^\/api\/auth\/login\//.test(url);
};

export const $axios = axios.create(config)
applyAuthTokenInterceptor($axios, {
  async requestRefresh(refresh_token) {
    return await new Promise((resolve, reject) => {
      axios
        .post(`${BASE_URL}/api/auth/refresh_token`, { refresh_token })
        .then(res => res.data.access_token)
        .then(resolve)
        .catch(err => {
          MessageBox.error(get(err, 'response.data.message', ''));
          setAuthTokens({
            accessToken: '',
            refreshToken: ''
          });
          resolve('');
          // router.push('/Login');
        });
    });
  }
});
$axios.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    if (/^\/api\//.test(config.url || '')) {
      config.baseURL = BASE_URL;
    }
    if (isLoginAPI(config.url) && config.data.username && config.data.password) {
      setAuthTokens({
        accessToken: '',
        refreshToken: ''
      });
    }
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
$axios.interceptors.response.use(
  function (response) {
    // Do something with response data
    if (isLoginAPI(response.config.url)) {
      const { access_token, refresh_token, userInfo } = response.data || {};
      access_token &&
        refresh_token &&
        setAuthTokens({
          accessToken: access_token,
          refreshToken: refresh_token
        });
      if (userInfo) {
        // store.commit('userInfo', userInfo);
      }
    } else if (response.config.url === '/api/auth/logout') {
      clearAuthTokens();
      // store.commit('userInfo', {});
    }
    return response;
  },
  function (error) {
    // Do something with response error
    const code = get(error, 'response.status', 500);
    const message = get(error, 'response.data.message', get(error, 'message', '未知错误'));
    console.warn('axios error =>', code, message);
    if (!['Unauthorized'].includes(message)) {
      MessageBox.error(message);
    }
    return Promise.reject(error);
  }
);
const App = () => {
  useAppStateHandle();
  useAppUpdateHandle();
  useFileDownloadHandle();
  const platform = usePlatform();

  return (
    <HashRouter>
      {platform === 'win32' && <WindowButton />}
      <AxiosProvider instance={$axios}>
        <SideBar className={platform === 'win32' ? 'app-win32-wrapper' : ''} routes={routes} />
        <div className="page-container">
          {routes.map(
            route =>
              route.path && (
                <Route key={route.path} path={route.path} exact>
                  {({ match }) => (
                    <CSSTransition in={match !== null} exit={false} timeout={300} classNames="page" unmountOnExit>
                      <div className="page">
                        <div
                          className={
                            platform === 'win32'
                              ? 'app-main-content-wrapper app-win32-wrapper'
                              : 'app-main-content-wrapper'
                          }
                        >
                          {route.component && <route.component />}
                        </div>
                      </div>
                    </CSSTransition>
                  )}
                </Route>
              )
          )}
        </div></AxiosProvider>
    </HashRouter>
  );
};

export default App;
