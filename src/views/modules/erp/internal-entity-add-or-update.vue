<template>
  <el-dialog
    :title="dataForm.id ? '修改内部主体' : '新增内部主体'"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="76%"
    top="5vh">
    <el-form ref="dataForm" :model="dataForm" :rules="dataRule" label-width="130px" v-loading="loading">
      <el-row :gutter="20">
        <el-col :span="8"><el-form-item label="主体编码" prop="entityCode"><el-input v-model="dataForm.entityCode" :disabled="!!dataForm.id"></el-input></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="公司全称" prop="entityName"><el-input v-model="dataForm.entityName"></el-input></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="简称"><el-input v-model="dataForm.shortName"></el-input></el-form-item></el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="关联往来单位" prop="partnerId">
            <el-select v-model="dataForm.partnerId" filterable clearable style="width:100%" placeholder="请选择内部主体往来单位">
              <el-option v-for="item in partnerList" :key="item.id" :label="item.partnerName" :value="item.id"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8"><el-form-item label="默认主体"><el-switch v-model="dataForm.defaultFlag" :active-value="1" :inactive-value="0"></el-switch></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="状态"><el-radio-group v-model="dataForm.status"><el-radio :label="1">启用</el-radio><el-radio :label="0">停用</el-radio></el-radio-group></el-form-item></el-col>
      </el-row>
      <el-divider content-position="left">合同与印章</el-divider>
      <el-row :gutter="20">
        <el-col :span="12"><el-form-item label="合同模板路径"><el-input v-model="dataForm.contractTemplatePath" placeholder="服务器上的xlsx模板绝对路径"></el-input></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="印章图片路径"><el-input v-model="dataForm.stampFilePath" placeholder="服务器上的透明印章图片绝对路径"></el-input></el-form-item></el-col>
      </el-row>
      <el-alert title="合同模板或印章未配置时仍可录单，但该主体不能生成PDF合同。" type="warning" :closable="false" show-icon></el-alert>
      <el-divider content-position="left">银行与开票信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="8"><el-form-item label="账户户名"><el-input v-model="dataForm.bankAccountName"></el-input></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="开户行"><el-input v-model="dataForm.bankName"></el-input></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="银行账号"><el-input v-model="dataForm.bankAccount"></el-input></el-form-item></el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8"><el-form-item label="税号"><el-input v-model="dataForm.taxNo"></el-input></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="开票抬头"><el-input v-model="dataForm.invoiceTitle"></el-input></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="注册地址"><el-input v-model="dataForm.address"></el-input></el-form-item></el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8"><el-form-item label="联系人"><el-input v-model="dataForm.contactName"></el-input></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="联系电话"><el-input v-model="dataForm.contactPhone"></el-input></el-form-item></el-col>
        <el-col :span="8"><el-form-item label="备注"><el-input v-model="dataForm.remark"></el-input></el-form-item></el-col>
      </el-row>
    </el-form>
    <span slot="footer">
      <el-button @click="visible=false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="dataFormSubmit">保存</el-button>
    </span>
  </el-dialog>
</template>

<script>
function defaultForm () {
  return {
    id: 0, entityCode: '', entityName: '', shortName: '', partnerId: '', defaultFlag: 0,
    contractTemplatePath: '', stampFilePath: '', bankAccountName: '', bankName: '', bankAccount: '',
    taxNo: '', invoiceTitle: '', address: '', contactName: '', contactPhone: '', remark: '', status: 1
  }
}

export default {
  data () {
    return {
      visible: false,
      loading: false,
      submitLoading: false,
      partnerList: [],
      dataForm: defaultForm(),
      dataRule: {
        entityCode: [{ required: true, message: '主体编码不能为空', trigger: 'blur' }],
        entityName: [{ required: true, message: '公司全称不能为空', trigger: 'blur' }],
        partnerId: [{ required: true, message: '请选择关联往来单位', trigger: 'change' }]
      }
    }
  },
  methods: {
    init (id) {
      this.visible = true
      this.dataForm = defaultForm()
      this.loading = true
      Promise.all([this.loadPartners(), id ? this.loadDetail(id) : Promise.resolve()]).finally(() => { this.loading = false })
    },
    loadPartners () {
      return this.$http({
        url: this.$http.adornUrl('/erp/partner/select'),
        method: 'get',
        params: this.$http.adornParams({ businessRole: 'INTERNAL' })
      }).then(({ data }) => { this.partnerList = (data && data.list) || [] })
    },
    loadDetail (id) {
      return this.$http({ url: this.$http.adornUrl(`/erp/internalentity/info/${id}`), method: 'get' }).then(({ data }) => {
        if (data && data.code === 0) this.dataForm = Object.assign(defaultForm(), data.internalEntity || {})
      })
    },
    dataFormSubmit () {
      this.$refs.dataForm.validate(valid => {
        if (!valid || this.submitLoading) return
        this.submitLoading = true
        this.$http({
          url: this.$http.adornUrl(this.dataForm.id ? '/erp/internalentity/update' : '/erp/internalentity/save'),
          method: 'post',
          data: this.$http.adornData(this.dataForm)
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('保存成功')
            this.visible = false
            this.$emit('refreshDataList')
          } else {
            this.$message.error((data && data.msg) || '保存失败')
          }
        }).finally(() => { this.submitLoading = false })
      })
    }
  }
}
</script>
