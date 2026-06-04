<template>
  <el-dialog
    :title="`${warehouse.warehouseName || '仓库'} - 费用历史`"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="980px">
    <el-alert
      title="费用统一按元/吨维护；系统取业务日期当天已生效的最新价格，跨调价日期时后续计算会按生效区间拆分。"
      type="info"
      show-icon
      :closable="false"
      class="fee-rate-tip">
    </el-alert>

    <el-form :model="dataForm" :rules="dataRule" ref="dataForm" label-width="145px" class="fee-rate-form">
      <el-row :gutter="14">
        <el-col :span="8">
          <el-form-item label="生效日期" prop="effectiveDate">
            <el-date-picker
              v-model="dataForm.effectiveDate"
              value-format="yyyy-MM-dd"
              type="date"
              placeholder="选择日期"
              style="width: 100%;">
            </el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="仓储冷冻费(元/吨)" prop="frozenStorageFee">
            <el-input-number v-model="dataForm.frozenStorageFee" :precision="2" :min="0" :controls="false" style="width: 100%;"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="仓储冷藏费(元/吨)" prop="chilledStorageFee">
            <el-input-number v-model="dataForm.chilledStorageFee" :precision="2" :min="0" :controls="false" style="width: 100%;"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="冷链冷冻装卸费(元/吨)" prop="frozenColdFee">
            <el-input-number v-model="dataForm.frozenColdFee" :precision="2" :min="0" :controls="false" style="width: 100%;"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="冷链冷藏装卸费(元/吨)" prop="chilledColdFee">
            <el-input-number v-model="dataForm.chilledColdFee" :precision="2" :min="0" :controls="false" style="width: 100%;"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态">
            <el-select v-model="dataForm.status" style="width: 100%;">
              <el-option label="启用" :value="1"></el-option>
              <el-option label="停用" :value="0"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="16">
          <el-form-item label="备注">
            <el-input v-model="dataForm.remark" maxlength="500" show-word-limit></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label-width="0">
            <el-button type="primary" :loading="saving" @click="submitHandle">{{ dataForm.id ? '保存修改' : '新增价格' }}</el-button>
            <el-button v-if="dataForm.id" @click="resetForm">取消编辑</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" height="340">
      <el-table-column prop="effectiveDate" label="生效日期" width="120" align="center" header-align="center"></el-table-column>
      <el-table-column prop="frozenStorageFee" label="仓储冷冻费(元/吨)" width="150" align="right" header-align="center"></el-table-column>
      <el-table-column prop="chilledStorageFee" label="仓储冷藏费(元/吨)" width="150" align="right" header-align="center"></el-table-column>
      <el-table-column prop="frozenColdFee" label="冷链冷冻装卸费(元/吨)" width="180" align="right" header-align="center"></el-table-column>
      <el-table-column prop="chilledColdFee" label="冷链冷藏装卸费(元/吨)" width="180" align="right" header-align="center"></el-table-column>
      <el-table-column label="状态" width="80" align="center" header-align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column fixed="right" label="操作" width="110" align="center" header-align="center">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="editHandle(scope.row)">编辑</el-button>
          <el-button type="text" size="small" @click="deleteHandle(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">关闭</el-button>
    </span>
  </el-dialog>
</template>

<script>
  const defaultForm = () => ({
    id: 0,
    warehouseId: 0,
    effectiveDate: '',
    frozenStorageFee: 0,
    chilledStorageFee: 0,
    frozenColdFee: 0,
    chilledColdFee: 0,
    status: 1,
    remark: ''
  })

  export default {
    data () {
      return {
        visible: false,
        warehouse: {},
        dataList: [],
        dataListLoading: false,
        saving: false,
        dataForm: defaultForm(),
        dataRule: {
          effectiveDate: [
            { required: true, message: '生效日期不能为空', trigger: 'change' }
          ],
          frozenStorageFee: [
            { required: true, message: '仓储冷冻费不能为空', trigger: 'blur' }
          ],
          chilledStorageFee: [
            { required: true, message: '仓储冷藏费不能为空', trigger: 'blur' }
          ],
          frozenColdFee: [
            { required: true, message: '冷链冷冻装卸费不能为空', trigger: 'blur' }
          ],
          chilledColdFee: [
            { required: true, message: '冷链冷藏装卸费不能为空', trigger: 'blur' }
          ]
        }
      }
    },
    methods: {
      init (warehouse) {
        this.visible = true
        this.warehouse = Object.assign({}, warehouse || {})
        this.resetForm()
        this.getDataList()
      },
      resetForm () {
        this.dataForm = defaultForm()
        this.dataForm.warehouseId = this.warehouse.id || 0
        this.$nextTick(() => {
          this.$refs.dataForm && this.$refs.dataForm.clearValidate()
        })
      },
      getDataList () {
        if (!this.warehouse.id) {
          this.dataList = []
          return
        }
        this.dataListLoading = true
        this.$http({
          url: this.$http.adornUrl(`/erp/warehouse/rate/list/${this.warehouse.id}`),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.dataList = data.list || []
          } else {
            this.dataList = []
            this.$message.error(data.msg || '获取费用历史失败')
          }
          this.dataListLoading = false
        }).catch(() => {
          this.dataListLoading = false
          this.$message.error('获取费用历史失败')
        })
      },
      editHandle (row) {
        this.dataForm = Object.assign(defaultForm(), row)
      },
      submitHandle () {
        this.$refs.dataForm.validate((valid) => {
          if (!valid) {
            return
          }
          this.saving = true
          this.$http({
            url: this.$http.adornUrl(`/erp/warehouse/rate/${this.dataForm.id ? 'update' : 'save'}`),
            method: 'post',
            data: this.$http.adornData(this.dataForm)
          }).then(({data}) => {
            if (data && data.code === 0) {
              this.$message.success('保存成功')
              this.resetForm()
              this.getDataList()
              this.$emit('refreshDataList')
            } else {
              this.$message.error(data.msg || '保存失败')
            }
            this.saving = false
          }).catch(() => {
            this.saving = false
            this.$message.error('保存失败')
          })
        })
      },
      deleteHandle (id) {
        this.$confirm('确定删除这条费用历史吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.dataListLoading = true
          this.$http({
            url: this.$http.adornUrl(`/erp/warehouse/rate/delete/${id}`),
            method: 'post',
            data: this.$http.adornData({})
          }).then(({data}) => {
            if (data && data.code === 0) {
              this.$message.success('删除成功')
              this.resetForm()
              this.getDataList()
              this.$emit('refreshDataList')
            } else {
              this.$message.error(data.msg || '删除失败')
              this.dataListLoading = false
            }
          }).catch(() => {
            this.dataListLoading = false
            this.$message.error('删除失败')
          })
        }).catch(() => {})
      }
    }
  }
</script>

<style scoped>
  .fee-rate-tip {
    margin-bottom: 14px;
  }

  .fee-rate-form {
    margin-bottom: 8px;
  }
</style>
