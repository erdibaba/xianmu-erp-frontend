<template>
  <el-dialog
    :title="dataForm.id ? '修改价格' : '新增价格'"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="760px">
    <el-form :model="dataForm" :rules="dataRule" ref="dataForm" label-width="110px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="产品" prop="productId">
            <el-select v-model="dataForm.productId" filterable placeholder="请选择产品" style="width: 100%;">
              <el-option
                v-for="item in productList"
                :key="item.id"
                :label="item.productName + ' / ' + item.productCode"
                :value="item.id">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="往来单位">
            <el-select v-model="dataForm.partnerId" filterable clearable placeholder="请选择单位" style="width: 100%;">
              <el-option
                v-for="item in partnerList"
                :key="item.id"
                :label="item.partnerName"
                :value="item.id">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="价格类型" prop="priceType">
            <el-select v-model="dataForm.priceType" placeholder="请选择">
              <el-option
                v-for="item in priceTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="生效日期" prop="effectiveDate">
            <el-date-picker v-model="dataForm.effectiveDate" type="datetime" placeholder="选择日期" style="width: 100%;"></el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="币种">
            <el-select v-model="dataForm.currency" placeholder="请选择">
              <el-option label="CNY" value="CNY"></el-option>
              <el-option label="USD" value="USD"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="未税单价" prop="unitPrice">
            <el-input v-model.number="dataForm.unitPrice"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="税率(%)">
            <el-input v-model.number="dataForm.taxRate"></el-input>
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
  import { PRICE_TYPE_OPTIONS, toDate } from './const'

  const defaultForm = () => ({
    id: 0,
    productId: '',
    partnerId: '',
    priceType: 1,
    effectiveDate: new Date(),
    currency: 'CNY',
    unitPrice: 0,
    taxRate: 9,
    remark: '',
    status: 1
  })

  export default {
    data () {
      return {
        visible: false,
        dataForm: defaultForm(),
        dataRule: {
          productId: [
            { required: true, message: '产品不能为空', trigger: 'change' }
          ],
          priceType: [
            { required: true, message: '价格类型不能为空', trigger: 'change' }
          ],
          effectiveDate: [
            { required: true, message: '生效日期不能为空', trigger: 'change' }
          ],
          unitPrice: [
            { required: true, message: '单价不能为空', trigger: 'blur' }
          ]
        },
        priceTypeOptions: PRICE_TYPE_OPTIONS,
        productList: [],
        partnerList: []
      }
    },
    methods: {
      init (id, productList, partnerList) {
        this.visible = true
        this.productList = productList || []
        this.partnerList = partnerList || []
        this.dataForm = defaultForm()
        this.dataForm.id = id || 0
        this.$nextTick(() => {
          this.$refs.dataForm.resetFields()
          if (this.dataForm.id) {
            this.$http({
              url: this.$http.adornUrl(`/erp/productprice/info/${this.dataForm.id}`),
              method: 'get',
              params: this.$http.adornParams()
            }).then(({data}) => {
              if (data && data.code === 0) {
                const form = Object.assign(defaultForm(), data.productPrice || {})
                form.effectiveDate = toDate(form.effectiveDate)
                this.dataForm = form
              } else {
                this.$message.error(data.msg || '获取价格失败')
              }
            })
          }
        })
      },
      dataFormSubmit () {
        this.$refs.dataForm.validate((valid) => {
          if (!valid) {
            return
          }
          this.$http({
            url: this.$http.adornUrl(`/erp/productprice/${!this.dataForm.id ? 'save' : 'update'}`),
            method: 'post',
            data: this.$http.adornData(this.dataForm)
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
