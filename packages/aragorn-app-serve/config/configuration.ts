export const SECRET = 'Q2IF8gcbowWVkVgcrPqNxhqhDal83X8S';
export const SECRET_COOKIE = 'Q2IF8gcbowW';
export const EXPIRESIN = '12h';
export const IsDevelopment = process.env.NODE_ENV === 'development';
export const ACLAPPID = '2c6ba82af9d14b8f980a86db83886992';

export const SECRETID = 'b6e2e93ab2e97a1fdbadc94e0624f785';
export const SECRETKEY = 'media_review_2021';
// acl 接口地址
export const ACL_URL = IsDevelopment
  ? 'http://10.200.12.121:8005/'
  : 'http://acl-back.imgo.tv/';
// 通用素材库 接口地址
export const GENERAL_URL = IsDevelopment
  ? 'http://10.200.20.87:8080/'
  : 'http://acl-back.imgo.tv/';
export default () => ({
  SECRET,
  // 统一登录 APP ID
  ACLAPPID,
  // acl 接口地址
  ACL_URL,
});
