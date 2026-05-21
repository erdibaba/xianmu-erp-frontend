<template>
  <el-dialog
    :title="dialogTitle"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="1100px">
    <el-form :model="dataForm" ref="dataForm" label-width="180px" class="dataimport-form">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane
          v-for="group in formGroups"
          :key="group.title"
          :label="group.title"
          :name="group.title">
          <el-row :gutter="20">
            <el-col
              v-for="field in group.fields"
              :key="field.prop"
              :xs="24"
              :sm="24"
              :md="12"
              :lg="8">
              <el-form-item :label="field.label">
                <el-input
                  v-model="dataForm[field.prop]"
                  :type="field.prop.indexOf('Description') !== -1 ? 'textarea' : 'text'"
                  :rows="field.prop.indexOf('Description') !== -1 ? 3 : 1"
                  :readonly="readonly"
                  :placeholder="readonly ? '' : '请输入' + field.label"
                  clearable>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">{{ readonly ? '关闭' : '取消' }}</el-button>
      <el-button v-if="!readonly" type="primary" @click="dataFormSubmit()">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
  import { FORM_GROUPS, createDefaultForm } from './dataimport-fields'

  export default {
    data () {
      return {
        visible: false,
        readonly: false,
        activeTab: FORM_GROUPS[0].title,
        formGroups: FORM_GROUPS,
        dataForm: createDefaultForm()
      }
    },
    computed: {
      dialogTitle () {
        if (this.readonly) {
          return '查看导入数据'
        }
        return '修改导入数据'
      }
    },
    methods: {
      init (id, readonly) {
        this.visible = true
        this.readonly = !!readonly
        this.activeTab = this.formGroups[0].title
        this.dataForm = createDefaultForm()
        this.dataForm.id = id || 0
        this.$nextTick(() => {
          if (this.$refs.dataForm) {
            this.$refs.dataForm.clearValidate()
          }
          if (this.dataForm.id) {
            this.getInfo()
          }
        })
      },
      getInfo () {
        this.$http({
          url: this.$http.adornUrl(`/generator/dataimport/info/${this.dataForm.id}`),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.dataForm = Object.assign(createDefaultForm(), data.dataImport || {})
          } else {
            this.$message.error(data.msg || '获取详情失败')
          }
        })
      },
      dataFormSubmit () {
        const formData = Object.assign({}, this.dataForm, {
          status: this.dataForm.status || 1
        })
        this.$http({
          url: this.$http.adornUrl('/generator/dataimport/update'),
          method: 'post',
          data: this.$http.adornData(formData)
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.$message({
              message: '操作成功',
              type: 'success',
              duration: 1500,
              onClose: () => {
                this.visible = false
                this.$emit('refreshDataList')
              }
            })
          } else {
            this.$message.error(data.msg || '保存失败')
          }
        })
      }
    }
  }
</script>

<style scoped>
  .dataimport-form /deep/ .el-textarea__inner[readonly],
  .dataimport-form /deep/ .el-input__inner[readonly] {
    color: #606266;
    background-color: #f5f7fa;
  }
</style>
