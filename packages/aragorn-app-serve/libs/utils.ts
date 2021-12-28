export function BuildHeaders(req: any, userIp: string) {
  const { user, headers } = req;
  // const { menuurl } = headers;
  //   const { menuId, menuName } = MenuInfo[menuurl] || { menuId: 0, menuName: '' };
  // console.log(headers)
  const headersRebuild = {
    userId: user?.id,
    userNum: user?.userAccount,
    userName: '',
    // menuId,
    // menuName: encodeURI(menuName),
    userIp: GetIpArress(headers, userIp),
  };
  return headersRebuild;
}

export function GetIpArress(headers, userIp) {
  const ipAddressStr =
    headers['x-forwarded-for'] ||
    headers['Proxy-Client-IP'] ||
    headers['WL-Proxy-Client-IP'] ||
    headers['HTTP_CLIENT_IP'] ||
    headers['HTTP_X_FORWARDED_FOR'] ||
    userIp;
  const ipAddressArr = ipAddressStr.match(
    /((25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))/,
  );
  const ipAddress = Array.isArray(ipAddressArr)
    ? ipAddressArr[0]
    : ipAddressStr;
  console.log('user ip', ipAddress);
  return ipAddress;
}
