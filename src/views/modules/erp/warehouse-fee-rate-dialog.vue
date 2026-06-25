<template>
  <el-dialog
    :title="`${warehouse.warehouseName || '仓库'} - 费用历史`"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="1180px">
    <el-alert
      title="仓储/装卸费用按元/吨维护；扫码费和附加费用按各自计费单位维护。系统取业务日期当天已生效的最新价格。"
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
          <el-form-item label="扫码费方式" prop="scanFeeUnit">
            <el-select v-model="dataForm.scanFeeUnit" style="width: 100%;">
              <el-option label="按吨" value="TON"></el-option>
              <el-option label="按箱" value="BOX"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="扫码费单价" prop="scanFeeRate">
            <el-input-number v-model="dataForm.scanFeeRate" :precision="2" :min="0" :controls="false" style="width: 100%;"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="计重口径" prop="weightBasis">
            <el-select v-model="dataForm.weightBasis" style="width: 100%;">
              <el-option label="净重" value="NET"></el-option>
              <el-option label="毛重" value="GROSS"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="缠膜费">
            <div class="fee-unit-row">
              <el-input-number v-model="dataForm.wrappingFee" :precision="2" :min="0" :controls="false"></el-input-number>
              <el-select v-model="dataForm.wrappingFeeUnit">
                <el-option label="元/吨" value="TON"></el-option>
                <el-option label="元/箱" value="BOX"></el-option>
                <el-option label="元/托" value="PALLET"></el-option>
                <el-option label="元/柜" value="CONTAINER"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="分拣费">
            <div class="fee-unit-row">
              <el-input-number v-model="dataForm.sortingFee" :precision="2" :min="0" :controls="false"></el-input-number>
              <el-select v-model="dataForm.sortingFeeUnit">
                <el-option label="元/吨" value="TON"></el-option>
                <el-option label="元/箱" value="BOX"></el-option>
                <el-option label="元/托" value="PALLET"></el-option>
                <el-option label="元/柜" value="CONTAINER"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="重复上下架费">
            <div class="fee-unit-row">
              <el-input-number v-model="dataForm.repeatedHandlingFee" :precision="2" :min="0" :controls="false"></el-input-number>
              <el-select v-model="dataForm.repeatedHandlingFeeUnit">
                <el-option label="元/吨" value="TON"></el-option>
                <el-option label="元/箱" value="BOX"></el-option>
                <el-option label="元/托" value="PALLET"></el-option>
                <el-option label="元/柜" value="CONTAINER"></el-option>
              </el-select>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="存货人变更费">
            <div class="fee-unit-row">
              <el-input-number v-model="dataForm.ownerChangeFee" :precision="2" :min="0" :controls="false"></el-input-number>
              <el-select v-model="dataForm.ownerChangeFeeUnit">
                <el-option label="元/吨" value="TON"></el-option>
                <el-option label="元/箱" value="BOX"></el-option>
                <el-option label="元/托" value="PALLET"></el-option>
                <el-option label="元/柜" value="CONTAINER"></el-option>
              </el-select>
            </div>
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
        <el-col :span="24">
          <div class="color-fee-header">
            <span>分色费阶梯</span>
            <el-button type="text" @click="addColorFeeTier">新增阶梯</el-button>
          </div>
          <el-table :data="dataForm.colorFeeTierList" border size="mini" class="color-fee-table">
            <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
            <el-table-column label="数量单位" width="110">
              <template slot-scope="scope">
                <el-select v-model="scope.row.rangeUnit" size="mini">
                  <el-option label="吨" value="TON"></el-option>
                  <el-option label="箱" value="BOX"></el-option>
                  <el-option label="柜" value="CONTAINER"></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="起始数量" width="120">
              <template slot-scope="scope">
                <el-input-number v-model="scope.row.rangeStart" :precision="2" :min="0" :controls="false" size="mini"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column label="结束数量" width="120">
              <template slot-scope="scope">
                <el-input-number v-model="scope.row.rangeEnd" :precision="2" :min="0" :controls="false" size="mini" placeholder="空=以上"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column label="费用金额" width="120">
              <template slot-scope="scope">
                <el-input-number v-model="scope.row.feeAmount" :precision="2" :min="0" :controls="false" size="mini"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column label="费用单位" width="110">
              <template slot-scope="scope">
                <el-select v-model="scope.row.feeUnit" size="mini">
                  <el-option label="元/吨" value="TON"></el-option>
                  <el-option label="元/箱" value="BOX"></el-option>
                  <el-option label="元/柜" value="CONTAINER"></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="150">
              <template slot-scope="scope">
                <el-input v-model="scope.row.remark" size="mini" maxlength="255"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="mini" @click="removeColorFeeTier(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注">
            <el-input v-model="dataForm.remark" maxlength="500" show-word-limit></el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" height="380">
      <el-table-column prop="effectiveDate" label="生效日期" width="120" align="center" header-align="center"></el-table-column>
      <el-table-column prop="frozenStorageFee" label="仓储冷冻费(元/吨)" width="150" align="right" header-align="center"></el-table-column>
      <el-table-column prop="chilledStorageFee" label="仓储冷藏费(元/吨)" width="150" align="right" header-align="center"></el-table-column>
      <el-table-column prop="frozenColdFee" label="冷链冷冻装卸费(元/吨)" width="180" align="right" header-align="center"></el-table-column>
      <el-table-column prop="chilledColdFee" label="冷链冷藏装卸费(元/吨)" width="180" align="right" header-align="center"></el-table-column>
      <el-table-column label="扫码费方式" width="110" align="center" header-align="center">
        <template slot-scope="scope">{{ scanFeeUnitLabel(scope.row.scanFeeUnit) }}</template>
      </el-table-column>
      <el-table-column prop="scanFeeRate" label="扫码费单价" width="110" align="right" header-align="center"></el-table-column>
      <el-table-column label="计重口径" width="90" align="center" header-align="center">
        <template slot-scope="scope">{{ weightBasisLabel(scope.row.weightBasis) }}</template>
      </el-table-column>
      <el-table-column label="缠膜费" width="120" align="right" header-align="center">
        <template slot-scope="scope">{{ feeWithUnit(scope.row.wrappingFee, scope.row.wrappingFeeUnit) }}</template>
      </el-table-column>
      <el-table-column label="分拣费" width="120" align="right" header-align="center">
        <template slot-scope="scope">{{ feeWithUnit(scope.row.sortingFee, scope.row.sortingFeeUnit) }}</template>
      </el-table-column>
      <el-table-column label="重复上下架" width="130" align="right" header-align="center">
        <template slot-scope="scope">{{ feeWithUnit(scope.row.repeatedHandlingFee, scope.row.repeatedHandlingFeeUnit) }}</template>
      </el-table-column>
      <el-table-column label="存货人变更" width="130" align="right" header-align="center">
        <template slot-scope="scope">{{ feeWithUnit(scope.row.ownerChangeFee, scope.row.ownerChangeFeeUnit) }}</template>
      </el-table-column>
      <el-table-column label="分色费阶梯" min-width="220" show-overflow-tooltip>
        <template slot-scope="scope">{{ colorFeeSummary(scope.row.colorFeeTierList) }}</template>
      </el-table-column>
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
      <el-button v-if="dataForm.id" @click="resetForm">取消编辑</el-button>
      <el-button type="primary" :loading="saving" @click="submitHandle">{{ dataForm.id ? '保存修改' : '新增价格' }}</el-button>
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
    scanFeeUnit: 'TON',
    scanFeeRate: 0,
    weightBasis: 'NET',
    wrappingFee: 0,
    wrappingFeeUnit: 'PALLET',
    sortingFee: 0,
    sortingFeeUnit: 'BOX',
    repeatedHandlingFee: 0,
    repeatedHandlingFeeUnit: 'PALLET',
    ownerChangeFee: 0,
    ownerChangeFeeUnit: 'CONTAINER',
    colorFeeTierList: [],
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
          ],
          scanFeeUnit: [
            { required: true, message: '扫码费方式不能为空', trigger: 'change' }
          ],
          scanFeeRate: [
            { required: true, message: '扫码费单价不能为空', trigger: 'blur' }
          ],
          weightBasis: [
            { required: true, message: '计重口径不能为空', trigger: 'change' }
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
        this.dataForm = Object.assign(defaultForm(), JSON.parse(JSON.stringify(row || {})))
        this.dataForm.colorFeeTierList = this.dataForm.colorFeeTierList || []
      },
      scanFeeUnitLabel (unit) {
        return unit === 'BOX' ? '按箱' : '按吨'
      },
      weightBasisLabel (value) {
        return value === 'GROSS' ? '毛重' : '净重'
      },
      feeUnitLabel (unit) {
        const map = { TON: '吨', BOX: '箱', PALLET: '托', CONTAINER: '柜' }
        return map[unit] || unit || '-'
      },
      feeWithUnit (amount, unit) {
        const value = Number(amount || 0).toFixed(2)
        return `${value}/ ${this.feeUnitLabel(unit)}`
      },
      colorFeeSummary (tiers) {
        if (!tiers || !tiers.length) return '-'
        return tiers.map(item => {
          const start = Number(item.rangeStart || 0).toString()
          const end = item.rangeEnd === null || item.rangeEnd === undefined || item.rangeEnd === '' ? '以上' : Number(item.rangeEnd).toString()
          return `${start}-${end}${this.feeUnitLabel(item.rangeUnit)} ${Number(item.feeAmount || 0).toFixed(2)}元/${this.feeUnitLabel(item.feeUnit)}`
        }).join('；')
      },
      addColorFeeTier () {
        if (!this.dataForm.colorFeeTierList) {
          this.$set(this.dataForm, 'colorFeeTierList', [])
        }
        this.dataForm.colorFeeTierList.push({
          rangeUnit: 'TON',
          rangeStart: 0,
          rangeEnd: null,
          feeAmount: 0,
          feeUnit: 'TON',
          remark: ''
        })
      },
      removeColorFeeTier (index) {
        this.dataForm.colorFeeTierList.splice(index, 1)
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

  .fee-unit-row {
    display: flex;
    gap: 8px;
  }

  .fee-unit-row .el-input-number {
    flex: 1;
  }

  .fee-unit-row .el-select {
    width: 92px;
  }

  .color-fee-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 2px 0 8px;
    font-weight: 600;
  }

  .color-fee-table {
    margin-bottom: 12px;
  }

  .color-fee-table .el-input-number,
  .color-fee-table .el-select {
    width: 100%;
  }
</style>
