import './App.css';
import { bitable, FieldType, IFieldConfig, IFieldMeta, ITableMeta } from "@lark-base-open/js-sdk";
import { ArrayField, Button, Form, Toast, Divider } from '@douyinfe/semi-ui';
import { BaseFormApi } from '@douyinfe/semi-foundation/lib/es/form/interface';
import { IconPlusCircle, IconMinusCircle } from '@douyinfe/semi-icons';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { asyncForEach } from './utils';

export default function App() {
  // 多语言
  const { t } = useTranslation();

  // 常量
  const FieldTypes = useMemo(() => [
    { 'type': FieldType.Text, 'description': t('text_field') },
    { 'type': FieldType.Number, 'description': t('number_field') },
    { 'type': FieldType.SingleSelect, 'description': t('single_select_field') },
    { 'type': FieldType.MultiSelect, 'description': t('multi_select_field') },
    { 'type': FieldType.DateTime, 'description': t('date_time_field') },
    { 'type': FieldType.Checkbox, 'description': t('checkbox_field') },
    { 'type': FieldType.User, 'description': t('user_field') },
    { 'type': FieldType.Phone, 'description': t('phone_field') },
    { 'type': FieldType.Url, 'description': t('url_field') },
    { 'type': FieldType.Attachment, 'description': t('attachment_field') },
    { 'type': FieldType.SingleLink, 'description': t('single_link_field') },
    { 'type': FieldType.Lookup, 'description': t('lookup_field') },
    { 'type': FieldType.Formula, 'description': t('formula_field') },
    { 'type': FieldType.DuplexLink, 'description': t('duplex_link_field') },
    { 'type': FieldType.Location, 'description': t('location_field') },
    { 'type': FieldType.GroupChat, 'description': t('group_chat_field') },
    { 'type': FieldType.CreatedTime, 'description': t('created_time_field') },
    { 'type': FieldType.ModifiedTime, 'description': t('modified_time_field') },
    { 'type': FieldType.CreatedUser, 'description': t('created_user_field') },
    { 'type': FieldType.ModifiedUser, 'description': t('modified_user_field') },
    { 'type': FieldType.AutoNumber, 'description': t('auto_number_field') },
    { 'type': FieldType.Barcode, 'description': t('barcode_field') },
    { 'type': FieldType.Progress, 'description': t('progress_field') },
    { 'type': FieldType.Currency, 'description': t('currency_field') },
    { 'type': FieldType.Rating, 'description': t('rating_field') }
  ], []);
  const [tableMetaList, setTableMetaList] = useState<ITableMeta[]>();
  const [fields, setFields] = useState<IFieldMeta[]>();
  const formApi = useRef<BaseFormApi>();
  const deleteFieldsForm = useRef<BaseFormApi>();

  const onDeleteFieldSubmit = useCallback(async (params: { table: string, deleteFields: string[] }) => {
    const { table: tableId, deleteFields } = params;
    const table = await bitable.base.getTableById(tableId);
    const failedCount = await asyncForEach(deleteFields, async (id) => {
      await table.deleteField(id);
    });
    if (!failedCount) {
      Toast.success(t('delete_fields_success'));
    } else {
      Toast.error(t('delete_fields_failed'));
    }
    refreshFieldList(tableId);
    deleteFieldsForm.current?.setValues({ ...deleteFieldsForm.current.getValues(), deleteFields: null });
  }, []);

  /**
   * 表单提交时的回调，这里params有什么取决于下面的form里面有哪些field
   */
  const onSubmit = useCallback(async (params: { table: string, newFields: { name: string, type: FieldType }[] }) => {
    const { table: tableId, newFields } = params;
    if (!newFields) {
      Toast.info(t('no_new_fields'));
      return;
    }
    if (tableId) {
      const table = await bitable.base.getTableById(tableId);
      const failCount = await asyncForEach(newFields, async (newField) => {
        const { name, type } = newField;
        await table.addField({
          type,
          name,
        } as IFieldConfig);
      });
      if (!failCount) {
        Toast.success(t('add_fields_done'));
      } else {
        Toast.error(t('field_name_repeat'));
      }
      refreshFieldList(tableId);
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
        deleteFieldsForm.current?.setValues({ table: selection.tableId, ...deleteFieldsForm.current.getValues() });
        refreshFieldList(selection.tableId || '');
      });
  }, []);

  return (
    <main className="main">
      <h1>{t('add_fields')}</h1>
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
        <ArrayField field='newFields' initValue={[
          {
            type: FieldType.Text,
            name: '',
          }
        ]}>
          {({ add, arrayFields }) => {
            return (
              <>
                {
                  arrayFields.map(({ field, key, remove }, i) => (
                    <div key={key} style={{ width: '100%' }}>
                      <div style={{ marginTop: 20, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        {`${t('new_field')}${i + 1}`}
                        <Button
                          type='danger'
                          theme='borderless'
                          icon={<IconMinusCircle />}
                          onClick={remove}
                          style={{ marginLeft: 12 }}
                        />
                      </div>
                      <Form.Select
                        field={`${field}[type]`}
                        label={t('select_field_type')}
                        style={{ width: '100%' }}
                        trigger='blur'
                        rules={[
                          { required: true, message: t('select_field_type') },
                        ]}
                        optionList={FieldTypes.map(type => ({
                          label: type.description,
                          value: type.type,
                        }))}
                      >
                      </Form.Select>
                      <Form.Input
                        field={`${field}[name]`}
                        label={t('input_field_name')}
                        trigger='blur'
                        rules={[
                          { required: true, message: t('input_field_name') },
                        ]}
                      />
                    </div>
                  ))
                }
                <Button onClick={add} icon={<IconPlusCircle />} theme='light' style={{ marginBottom: '20px' }}>{t('add_new_fields')}</Button>
              </>
            );
          }}
        </ArrayField>
        {/* 确认按钮 */}
        <p>
          <Button theme='solid' htmlType='submit'>{t('submit_button')}</Button>
        </p>
      </Form>
      <Divider margin='12px'/>
      <h1>{t('delete_fields')}</h1>
      <Form labelPosition='top' onSubmit={onDeleteFieldSubmit} getFormApi={(baseFormApi: BaseFormApi) => deleteFieldsForm.current = baseFormApi}>
        {/* 选择表格 */}
        <Form.Select
          field='table'
          label={{ text: t('select_table'), required: true }}
          rules={[
            { required: true, message: t('select_table_placeholder') },
          ]}
          trigger='blur'
          placeholder={t('select_table_placeholder')}
          onChange={(tableId) => { refreshFieldList(String(tableId)) }}  
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
        <Form.Select
          multiple
          field='deleteFields'
          label={{ text: t('select_fields'), required: true }}
          rules={[
            { required: true, message: t('select_fields_placeholder') },
          ]}
          trigger='blur'
          placeholder={t('select_fields_placeholder')}
          onChange={(tableId) => { refreshFieldList(String(tableId)) }}  
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
        <p>
          <Button theme='solid' htmlType='submit'>{t('submit_button')}</Button>
        </p>
      </Form>
    </main>
  )
}