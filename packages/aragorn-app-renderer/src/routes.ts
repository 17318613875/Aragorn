import React from 'react';
import { Grid, Package, Box, Info, LogIn, Settings, Upload, Server, IconProps } from 'react-feather';
import { Dashboard } from '@renderer/pages/Dashboard';
import { Uploader } from '@renderer/pages/Uploader';
import { Profile } from '@renderer/pages/Profile';
import { FileManage } from '@renderer/pages/FileManage';
import { About } from '@renderer/pages/About';
import { Login } from '@renderer/pages/Login';
import { Setting } from '@renderer/pages/Setting';

export type Routes = {
  name: string;
  path?: string;
  component?: React.FunctionComponent;
  icon: React.FC<IconProps>;
  isFooter?: boolean;
  meta?: {
    title?: string;
  };
}[];

export const routes: Routes = [
  {
    name: 'dashboard',
    path: '/',
    component: Dashboard,
    icon: Grid,
    meta: {
      title: '控制台'
    }
  },
  {
    name: 'uploader',
    path: '/uploader',
    component: Uploader,
    icon: Package,
    meta: {
      title: '上传器'
    }
  },
  {
    name: 'profile',
    path: '/profile/:id?',
    component: Profile,
    icon: Box,
    meta: {
      title: '上传器-配置'
    }
  },
  {
    name: 'fileManage',
    path: '/fileManage/:id?',
    component: FileManage,
    icon: Server,
    meta: {
      title: '文件管理'
    }
  },
  {
    name: 'upload',
    icon: Upload,
    meta: {
      title: '上传'
    }
  },
  {
    name: 'about',
    path: '/about',
    component: About,
    icon: Info,
    isFooter: true,
    meta: {
      title: '关于我们'
    }
  },
  {
    name: 'login',
    path: '/login',
    component: Login,
    icon: LogIn,
    isFooter: true,
    meta: {
      title: '登录'
    }
  },
  {
    name: 'setting',
    path: '/setting',
    component: Setting,
    icon: Settings,
    isFooter: true,
    meta: {
      title: '设置'
    }
  }
];
