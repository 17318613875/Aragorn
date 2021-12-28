import md5 from 'md5-node';
import { base64encode } from 'nodejs-base64';
export default function GetSign(body: any, appId: string, secretKey: string) {
  const t = new Date().getTime();
  const data =
    typeof body === 'string'
      ? base64encode(body)
      : base64encode(JSON.stringify(body));
  const sign = `appId=${appId}&data=${data}&t=${t}&appKey=${secretKey}`;
  if (!process.env.NODE_ENV) {
    //
    console.log('--签名--' + JSON.stringify(sign));
    console.log('--md5签名--' + md5(sign));
  }
  return { sign: md5(sign), t, appId, data };
}
