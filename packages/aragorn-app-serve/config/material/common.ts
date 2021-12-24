export const MaterialCommon = {};
export const MaterialCommonPageSizes = [10, 20, 50, 100];
export const MaterialCommonLayout = 'total, sizes, prev, pager, next, jumper';
export const MaterialCommonContainerStyle =
  'width: 100%; height: 100%; padding: 0';
export const MaterialCommonHeaderStyle = 'height: auto;padding: 0';
export const MaterialCommonMainStyle = 'padding: 0';
export const MaterialCommonFooterStyle = 'height: auto;padding: 0';
export const MaterialCommonFormType = {
  inline: true,
  size: 'mini',
};
const isFormItem = 'el-form-item';
const propsForm = {};
const propsFormItem = {};
const isSelect = 'el-select';
export const MaterialCommonPageConfig = {
  is: 'el-container',
  bind: {
    style: 'width: 100%; height: 100%; padding: 0',
  },
  items: [
    {
      is: 'el-header',
      bind: {
        style: 'height: auto;padding: 0',
      },
      items: [
        {
          is: 'el-form',
          model: 'form',
          bind: {
            size: 'mini',
            inline: true,
          },
          items: [
            {
              is: 'el-form-item',
              bind: {
                prop: 'generalLibrary',
                label: '所属库',
                rules: [
                  {
                    required: true,
                    message: '请选择所属库',
                    trigger: 'change',
                  },
                ],
              },
              value: 3,
              items: [
                {
                  is: 'el-select',
                  bind: {
                    prop: 'generalLibrary',
                    placeholder: '请选择所属库',
                  },
                  on: {
                    change: (val: any, vm: any) => {
                      console.log(val, vm);
                    },
                  },
                  items: [
                    {
                      is: 'el-option',
                      bind: {
                        value: 1,
                        label: '空镜库',
                      },
                    },
                    {
                      is: 'el-option',
                      bind: {
                        value: 2,
                        label: '音乐库',
                      },
                    },
                    {
                      is: 'el-option',
                      bind: {
                        value: 3,
                        label: '物料库',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      is: 'el-main',
      bind: {},
      items: [],
    },
    {
      is: 'el-footer',
      bind: {
        style: 'height: auto;padding: 0',
      },
    },
  ],
};
// export const MaterialCommonPageConfig = {
//   is: 'el-form',
//   bind: {
//     inline: true,
//     size: 'mini',
//   },
//   on: {},
//   items: [
//     {
//       is: isFormItem,
//       bind: propsFormItem,
//       on: {},
//       items: [
//         {
//           is: isSelect,
//           bind: {
//             prop: 'generalLibrary',
//             label: '所属库',
//             placeholder: '请选择所属库',
//             rules: [
//               { required: true, message: '请选择所属库', trigger: 'change' },
//             ],
//           },
//           on: {
//             change: (val: any, vm: any) => {
//               console.log(val, vm);
//             },
//           },
//           options: [
//             {
//               is: 'el-option',
//               value: 1,
//               label: '空镜库',
//             },
//             {
//               is: 'el-option',
//               value: 2,
//               label: '音乐库',
//             },
//             {
//               is: 'el-option',
//               value: 3,
//               label: '物料库',
//             },
//           ],
//           value: 3,
//         },
//       ],
//     },
//     // {
//     //   is: 'el-input',
//     //   // type: 'textarea',
//     //   prop: 'name',
//     //   label: 'Name',
//     //   placeholder: '请输入Name',
//     //   change: (val: any, vm: any) => {
//     //     console.log(val, vm);
//     //   },
//     // },
//     {
//       is: '',
//     },
//     {
//       is: 'el-select',
//       bind: {
//         prop: 'materialId',
//         label: '合集素材包',
//         placeholder: '请选择合集素材包',
//         options: [],
//       },
//       on: {
//         change: (val: any, vm: any) => {
//           console.log(val, vm);
//         },
//       },
//     },
//     {
//       is: 'el-button',
//       bind: {
//         type: 'primary',
//         prop: 'submit',
//       },
//       innerText: '提交',
//       on: {
//         click: (val: any, vm: any) => {
//           vm.$form.validate((valid: Boolean) => {
//             if (valid) {
//               console.log('submit!', vm.form, vm.insertData);

//               vm.$emit('update:loading', true);
//               vm.$emit('update:data', [{ name: 'LiLy', age: 10 }]);
//             } else {
//               console.error('error submit!!');
//               return false;
//             }
//           });
//         },
//       },
//     },
//     {
//       is: 'el-button',
//       bind: {
//         type: 'default',
//         prop: 'reset',
//       },
//       innerText: '重置',
//       on: {
//         click: (val: any, vm: any) => {
//           vm.$form.resetFields();
//           vm.$emit('update:loading', false);
//         },
//       },
//     },
//     {
//       is: 'el-divider',
//       bind: {
//         direction: 'vertical',
//         prop: 'divider1',
//       },
//     },
//     {
//       is: 'electron-upload',
//       bind: {
//         prop: 'electron-upload',
//         innerText: 'electron 上载',
//         'before-upload': (file, vm) => {
//           const path = vm.$route.path;
//           const data = vm.$store.state.tableData[path] || [];
//           data.push({
//             name: file.name,
//             path: file.path,
//             type: file.type,
//             size: file.size,
//             uploadStatus: 0,
//             md5: file.md5 || '',
//             lastModified: file.lastModified,
//             process: file.process || 0,
//             generalLibrary: vm.form.generalLibrary,
//             materialId: vm.form.materialId,
//           });
//           data.forEach(
//             (item, uploadStatus) => (item.uploadStatus = uploadStatus),
//           );
//           vm.$store.commit('tableData', {
//             [path]: data,
//           });
//         },
//       },
//       on: {},
//     },
//     {
//       is: 'el-divider',
//       bind: {
//         direction: 'vertical',
//         prop: 'divider1',
//       },
//     },
//     {
//       is: 'ali-upload',
//       bind: {
//         direction: 'vertical',
//         prop: 'divider1',
//       },
//       innerText: '阿里 上载',
//     },
//   ],
// };
export const MaterialCommonColumns = [
  {
    type: 'index',
    width: 50,
    label: '#',
  },
  {
    prop: 'name',
    label: '文件名称',
  },
  {
    prop: 'path',
    label: '文件路径',
  },
  {
    prop: 'type',
    label: '文件类型',
  },
  {
    prop: 'size',
    label: '文件大小',
  },
  {
    prop: 'md5',
    label: '文件MD5',
  },
  {
    prop: 'lastModified',
    label: '文件修改时间',
  },
  {
    prop: 'uploadStatus',
    label: '上载状态',
  },
  {
    prop: 'process',
    label: '上载进度',
  },
  {
    prop: 'generalLibrary',
    label: '所属库',
  },
  {
    prop: 'materialId',
    label: '合集素材包',
  },
  {
    prop: 'handler',
    label: '操作',
    options: [
      {
        is: 'el-button',
        type: 'text',
        prop: 'reset',
        innerText: '开始上传',
        dependFun: (row: any, vm: any) => {
          return row.md5 && [0, 4].includes(row.uploadStatus);
        },
        click: (row: any, vm: any) => {
          console.log('click', row, vm);
        },
      },
      {
        is: 'el-button',
        type: 'text',
        prop: 'reset',
        innerText: '暂停上传',
        dependFun: (row: any, vm: any) => {
          return row.md5 && [1].includes(row.uploadStatus);
        },
        click: (row: any, vm: any) => {
          console.log('click', row, vm);
        },
      },
      {
        is: 'el-button',
        type: 'text',
        prop: 'reset',
        innerText: '取消上传',
        dependFun: (row: any, vm: any) => {
          return row.md5 && [1].includes(row.uploadStatus);
        },
        click: (row: any, vm: any) => {
          vm.ElMessageBox.confirm('确定取消上传?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          })
            .then(() => {
              vm.ElMessage({
                type: 'success',
                message: 'Delete completed',
              });
            })
            .catch(() => {
              vm.ElMessage({
                type: 'info',
                message: 'Delete canceled',
              });
            });
        },
      },
      {
        is: 'el-button',
        type: 'text',
        prop: 'reset',
        innerText: '重新上传',
        dependFun: (row: any, vm: any) => {
          return row.md5 && [2, 3].includes(row.uploadStatus);
        },
        click: (row: any, vm: any) => {
          console.log('click', row, vm);
        },
      },
    ],
  },
];
