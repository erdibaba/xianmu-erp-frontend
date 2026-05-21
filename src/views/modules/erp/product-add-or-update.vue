<template>
  <el-dialog
    :title="dataForm.id ? '修改产品' : '新增产品'"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="760px">
    <el-form :model="dataForm" :rules="dataRule" ref="dataForm" label-width="110px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="产品编码" prop="productCode">
            <el-input v-model="dataForm.productCode"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="产品名称" prop="productName">
            <el-input v-model="dataForm.productName"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="英文名称">
            <el-input v-model="dataForm.productNameEn"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="规格">
            <el-input v-model="dataForm.productSpec"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="单位">
            <el-input v-model="dataForm.unit"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="品牌方" prop="brand">
            <el-select v-model="dataForm.brand" clearable filterable style="width: 100%;">
              <el-option
                v-for="item in brandOptions"
                :key="item.id"
                :label="item.partnerName"
                :value="item.partnerName">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="原产地">
            <el-input v-model="dataForm.originCountry"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态">
            <el-switch v-model="dataForm.status" :active-value="1" :inactive-value="0"></el-switch>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注">
            <el-input v-model="dataForm.remark" type="textarea" :rows="3"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="dataFormSubmit()">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
  const defaultForm = () => ({
    id: 0,
    productCode: '',
    productName: '',
    productNameEn: '',
    productSpec: '',
    unit: 'KG',
    brand: '',
    originCountry: '',
    status: 1,
    remark: ''
  })

  export default {
    data () {
      return {
        visible: false,
        partnerList: [],
        dataForm: defaultForm(),
        dataRule: {
          productCode: [
            { required: true, message: '产品编码不能为空', trigger: 'blur' }
          ],
          productName: [
            { required: true, message: '产品名称不能为空', trigger: 'blur' }
          ],
          brand: [
            { required: true, message: '品牌方不能为空', trigger: 'change' }
          ]
        }
      }
    },
    computed: {
      brandOptions () {
        return this.partnerList.filter(item => this.hasBusinessRole(item, 'BRAND'))
      }
    },
    methods: {
      hasBusinessRole (item, role) {
        const businessRole = (item && item.businessRole) || ''
        return businessRole.split(',').map(value => value.trim()).indexOf(role) !== -1
      },
      loadPartnerList (callback) {
        this.$http({
          url: this.$http.adornUrl('/erp/partner/select'),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({ data }) => {
          this.partnerList = (data && data.list) || []
          if (typeof callback === 'function') {
            callback()
          }
        })
      },
      init (id) {
        this.visible = true
        this.dataForm = defaultForm()
        this.dataForm.id = id || 0
        this.loadPartnerList(() => {
          this.$nextTick(() => {
            this.$refs.dataForm.resetFields()
            if (this.dataForm.id) {
              this.$http({
                url: this.$http.adornUrl(`/erp/product/info/${this.dataForm.id}`),
                method: 'get',
                params: this.$http.adornParams()
              }).then(({data}) => {
                if (data && data.code === 0) {
                  this.dataForm = Object.assign(defaultForm(), data.product || {})
                } else {
                  this.$message.error(data.msg || '获取产品失败')
                }
              })
            }
          })
        })
      },
      dataFormSubmit () {
        this.$refs.dataForm.validate((valid) => {
          if (!valid) {
            return
          }
          const payload = Object.assign({}, this.dataForm)
          delete payload.defaultTaxRate
          this.$http({
            url: this.$http.adornUrl(`/erp/product/${!this.dataForm.id ? 'save' : 'update'}`),
            method: 'post',
            data: this.$http.adornData(payload)
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
        })
      }
    }
  }
</script>
