import './App.css';
import { bitable, IFieldMeta, ITableMeta } from "@lark-base-open/js-sdk";
import { Button, Form } from '@douyinfe/semi-ui';
import { BaseFormApi } from '@douyinfe/semi-foundation/lib/es/form/interface';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export default function App() {
  const [tableMetaList, setTableMetaList] = useState<ITableMeta[]>();
  const [fields, setFields] = useState<IFieldMeta[]>();
  const formApi = useRef<BaseFormApi>();

  /**
   * 表单提交时的回调，这里params有什么取决于下面的form里面有哪些field
   */
  const onSubmit = useCallback(async (params: { table: string, targetField: string }) => {
    const { table: tableId } = params;
    if (tableId) {
      const table = await bitable.base.getTableById(tableId);
      // table.addRecord({
      //   fields: {},
      // });
    }
  }, []);

  /**
   * 刷新表格对应的字段列表，一般初始化时和table字段改了需要refresh一下
   * 如果需要让用户选择「字段」，才需要这个
   */
  const refreshFieldList = useCallback(async (tableId: string) => {
    const table = await bitable.base.getTableById(tableId);
    if (table) {
      const fieldList = await table.getFieldMetaList();
      // eg. 如果要过滤文本类型的列 ⬇⬇⬇⬇
      // const textFields = fieldList.filter(f => f.type === FieldType.Text);
      setFields(fieldList);
    }
  }, []);

  /**
   * 这里可以理解为componentDidMount，即组件挂载完成，可以在这里获取数据
   */
  useEffect(() => {
    Promise.all([bitable.base.getTableMetaList(), bitable.base.getSelection()])
      .then(([metaList, selection]) => {
        setTableMetaList(metaList);
        formApi.current?.setValues({ table: selection.tableId, ...formApi.current.getValues() });
        refreshFieldList(selection.tableId || '');
      });
  }, []);

  // 多语言
  const { t } = useTranslation();

  return (
    <main className="main">
      <Form labelPosition='top' onSubmit={onSubmit} getFormApi={(baseFormApi: BaseFormApi) => formApi.current = baseFormApi}>
        {/* 选择表格 */}
        <Form.Select
          field='table'
          label={{ text: t('select_table'), required: true }}
          rules={[
            { required: true, message: t('select_table_placeholder') },
          ]}
          trigger='blur'
          placeholder={t('select_table_placeholder')}
          style={{ width: '100%' }}>
          {
            Array.isArray(tableMetaList) && tableMetaList.map(({ name, id }) => {
              return (
                <Form.Select.Option key={id} value={id}>
                  {name}
                </Form.Select.Option>
              );
            })
          }
        </Form.Select>
        {/* 选择目标字段 */}
        <Form.Select
          label={{ text: t('select_target_field'), required: true }}
          rules={[
            { required: true, message: t('select_target_field_placeholder') },
          ]}
          trigger='blur'
          field='targetField'
          placeholder={t("select_target_field_placeholder")}
          style={{ width: '100%' }}
        >
          {
            Array.isArray(fields) && fields.map(({ name, id }) => {
              return (
                <Form.Select.Option key={id} value={id}>
                  {name}
                </Form.Select.Option>
              );
            })
          }
        </Form.Select>
        {/* 确认按钮 */}
        <Button theme='solid' htmlType='submit'>{t('submit_button')}</Button>
      </Form>
    </main>
  )
}