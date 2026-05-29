<template>
  <el-dialog
    :title="dataForm.id ? '修改仓库' : '新增仓库'"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="760px">
    <el-form :model="dataForm" :rules="dataRule" ref="dataForm" label-width="110px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="仓库编码" prop="warehouseCode">
            <el-input v-model="dataForm.warehouseCode"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="仓库名称" prop="warehouseName">
            <el-input v-model="dataForm.warehouseName"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="仓库类型" prop="warehouseType">
            <el-select v-model="dataForm.warehouseType" style="width: 100%;">
              <el-option v-for="item in warehouseTypeOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="计费单位">
            <el-select v-model="dataForm.feeUnit" style="width: 100%;">
              <el-option v-for="item in feeUnitOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="免仓天数">
            <el-input v-model.number="dataForm.freeStorageDays"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="仓储费(冷冻)">
            <el-input v-model.number="dataForm.frozenStorageFee"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="仓储费(冷藏)">
            <el-input v-model.number="dataForm.chilledStorageFee"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="冷链费(冷冻)">
            <el-input v-model.number="dataForm.frozenColdFee"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="冷链费(冷藏)">
            <el-input v-model.number="dataForm.chilledColdFee"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否自有">
            <el-switch v-model="dataForm.ownedByCompany" :active-value="1" :inactive-value="0"></el-switch>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系人">
            <el-input v-model="dataForm.contactName"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话">
            <el-input v-model="dataForm.contactPhone"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态">
            <el-switch v-model="dataForm.status" :active-value="1" :inactive-value="0"></el-switch>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="地址">
            <el-input v-model="dataForm.address"></el-input>
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
  import { WAREHOUSE_TYPE_OPTIONS, FEE_UNIT_OPTIONS } from './const'

  const defaultForm = () => ({
    id: 0,
    warehouseCode: '',
    warehouseName: '',
    warehouseType: 'COLD',
    ownedByCompany: 0,
    contactName: '',
    contactPhone: '',
    address: '',
    freeStorageDays: 0,
    dailyStorageFee: 0,
    dailyColdFee: 0,
    frozenStorageFee: 0,
    chilledStorageFee: 0,
    frozenColdFee: 0,
    chilledColdFee: 0,
    feeUnit: 'PIECE',
    status: 1,
    remark: ''
  })

  export default {
    data () {
      return {
        visible: false,
        warehouseTypeOptions: WAREHOUSE_TYPE_OPTIONS,
        feeUnitOptions: FEE_UNIT_OPTIONS,
        dataForm: defaultForm(),
        dataRule: {
          warehouseCode: [
            { required: true, message: '仓库编码不能为空', trigger: 'blur' }
          ],
          warehouseName: [
            { required: true, message: '仓库名称不能为空', trigger: 'blur' }
          ]
        }
      }
    },
    methods: {
      init (id) {
        this.visible = true
        this.dataForm = defaultForm()
        this.dataForm.id = id || 0
        this.$nextTick(() => {
          this.$refs.dataForm.resetFields()
          if (this.dataForm.id) {
            this.$http({
              url: this.$http.adornUrl(`/erp/warehouse/info/${this.dataForm.id}`),
              method: 'get',
              params: this.$http.adornParams()
            }).then(({data}) => {
              if (data && data.code === 0) {
                this.dataForm = Object.assign(defaultForm(), data.warehouse || {})
              } else {
                this.$message.error(data.msg || '获取仓库失败')
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
            url: this.$http.adornUrl(`/erp/warehouse/${!this.dataForm.id ? 'save' : 'update'}`),
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
