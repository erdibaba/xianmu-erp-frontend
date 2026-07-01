<template>
  <el-dialog
    title="新增出库批次"
    :visible.sync="visible"
    :close-on-click-modal="false"
    append-to-body
    width="1180px">
    <div class="batch-dialog" v-loading="loading">
      <el-form :model="form" ref="form" :rules="rules" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="货权" prop="ownershipName">
              <el-select v-model="form.ownershipName" placeholder="请选择货权" style="width: 100%;" @change="ownershipChange">
                <el-option v-for="item in ownershipOptions" :key="item" :label="item" :value="item"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="司机" prop="driverId">
              <el-select
                v-model="form.driverId"
                filterable
                remote
                reserve-keyword
                placeholder="输入司机姓名/车牌号/手机号搜索"
                :remote-method="searchDrivers"
                :loading="driverLoading"
                style="width: 100%;">
                <el-option
                  v-for="item in driverOptions"
                  :key="item.id"
                  :label="`${item.driverName} / ${item.plateNo} / ${item.mobile}`"
                  :value="item.id">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" plain @click="quickDriverVisible = true">新增司机</el-button>
          </el-col>
        </el-row>
      </el-form>

      <div class="section-title">
        <strong>本批次计划货物</strong>
        <span>只能选择当前货权下的销售单货物，计划箱数不能超过剩余可出箱数。</span>
      </div>
      <el-table :data="filteredCandidates" border stripe height="390">
        <el-table-column label="选择" width="65" align="center">
          <template slot-scope="scope">
            <el-checkbox v-model="scope.row._selected" :disabled="scope.row.remainingBoxes <= 0"></el-checkbox>
          </template>
        </el-table-column>
        <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
        <el-table-column prop="productCode" label="产品编码" width="105"></el-table-column>
        <el-table-column prop="productName" label="中文名称" min-width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="sourceContainerNo" label="柜号" width="135" show-overflow-tooltip></el-table-column>
        <el-table-column prop="contractFactoryNo" label="厂号" width="90" show-overflow-tooltip></el-table-column>
        <el-table-column prop="ownershipName" label="货权" width="145" show-overflow-tooltip></el-table-column>
        <el-table-column prop="boxes" label="销售单箱数" width="100" align="right"></el-table-column>
        <el-table-column prop="remainingBoxes" label="剩余可出" width="90" align="right"></el-table-column>
        <el-table-column label="计划箱数" width="125">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.plannedBoxes"
              :disabled="!scope.row._selected"
              :controls="false"
              :min="1"
              :max="scope.row.remainingBoxes"
              :precision="0"
              size="mini"
              style="width: 100%;"
              @change="plannedBoxesChange(scope.row)">
            </el-input-number>
          </template>
        </el-table-column>
        <el-table-column label="计划重量(KG)" width="145">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.plannedWeight"
              :disabled="!scope.row._selected"
              :controls="false"
              :min="0.001"
              :precision="3"
              size="mini"
              style="width: 100%;">
            </el-input-number>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button :disabled="submitLoading" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submit">保存批次</el-button>
    </span>

    <el-dialog
      title="新增司机"
      :visible.sync="quickDriverVisible"
      :close-on-click-modal="false"
      append-to-body
      width="480px">
      <el-form :model="driverForm" ref="driverForm" :rules="driverRules" label-width="90px">
        <el-form-item label="司机姓名" prop="driverName">
          <el-input v-model.trim="driverForm.driverName" maxlength="100"></el-input>
        </el-form-item>
        <el-form-item label="车牌号" prop="plateNo">
          <el-input v-model.trim="driverForm.plateNo" maxlength="50"></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model.trim="driverForm.mobile" maxlength="50"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button :disabled="driverSaving" @click="quickDriverVisible = false">取消</el-button>
        <el-button type="primary" :loading="driverSaving" @click="saveDriver">确认新增</el-button>
      </span>
    </el-dialog>
  </el-dialog>
</template>

<script>
export default {
  data () {
    return {
      visible: false,
      loading: false,
      submitLoading: false,
      driverLoading: false,
      driverSaving: false,
      quickDriverVisible: false,
      saleOrder: {},
      candidates: [],
      driverOptions: [],
      form: {
        driverId: '',
        ownershipName: ''
      },
      driverForm: {
        driverName: '',
        plateNo: '',
        mobile: ''
      },
      rules: {
        ownershipName: [{ required: true, message: '请选择货权', trigger: 'change' }],
        driverId: [{ required: true, message: '请选择司机', trigger: 'change' }]
      },
      driverRules: {
        driverName: [{ required: true, message: '请输入司机姓名', trigger: 'blur' }],
        plateNo: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
        mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
      }
    }
  },
  computed: {
    ownershipOptions () {
      return Array.from(new Set(this.candidates.map(item => item.ownershipName).filter(Boolean)))
    },
    filteredCandidates () {
      if (!this.form.ownershipName) return []
      return this.candidates.filter(item => item.ownershipName === this.form.ownershipName)
    }
  },
  methods: {
    init (saleOrder) {
      this.visible = true
      this.saleOrder = saleOrder || {}
      this.form = { driverId: '', ownershipName: '' }
      this.driverOptions = []
      this.buildCandidates()
      if (this.ownershipOptions.length === 1) {
        this.form.ownershipName = this.ownershipOptions[0]
      }
      this.$nextTick(() => {
        if (this.$refs.form) this.$refs.form.clearValidate()
      })
      this.searchDrivers('')
    },
    buildCandidates () {
      const source = this.saleOrder.saleType === 'SPOT'
        ? (this.saleOrder.allocationItemList || [])
        : (this.saleOrder.itemList || [])
      const usedMap = {}
      ;(this.saleOrder.outboundBatchList || []).forEach(batch => {
        if (Number(batch.status || 0) === 9) return
        ;(batch.planItemList || []).forEach(item => {
          const key = String(item.saleOrderItemId)
          usedMap[key] = Number(usedMap[key] || 0) + Number(item.plannedBoxes || 0)
        })
      })
      this.candidates = source.filter(item => item.id).map(item => {
        const totalBoxes = Number(item.boxes || 0)
        const usedBoxes = Number(usedMap[String(item.id)] || 0)
        const remainingBoxes = Math.max(0, totalBoxes - usedBoxes)
        return Object.assign({}, item, {
          ownershipName: item.ownershipName || '未确认',
          remainingBoxes,
          _selected: false,
          plannedBoxes: remainingBoxes > 0 ? remainingBoxes : 0,
          plannedWeight: this.proportionalWeight(item, remainingBoxes)
        })
      })
    },
    ownershipChange () {
      this.candidates.forEach(item => {
        if (item.ownershipName !== this.form.ownershipName) {
          item._selected = false
        }
      })
    },
    proportionalWeight (row, boxes) {
      const totalBoxes = Number(row.boxes || 0)
      const totalWeight = Number(row.contractQuantityKg || 0)
      if (totalBoxes <= 0 || boxes <= 0) return 0
      return Number((totalWeight * boxes / totalBoxes).toFixed(3))
    },
    plannedBoxesChange (row) {
      row.plannedWeight = this.proportionalWeight(row, Number(row.plannedBoxes || 0))
    },
    searchDrivers (keyword) {
      this.driverLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/saleorder/outbound/driver/select'),
        method: 'get',
        params: this.$http.adornParams({ keyword: keyword || '' })
      }).then(({ data }) => {
        this.driverOptions = data && data.code === 0 ? (data.page.list || []) : []
      }).finally(() => {
        this.driverLoading = false
      })
    },
    saveDriver () {
      this.$refs.driverForm.validate(valid => {
        if (!valid || this.driverSaving) return
        this.driverSaving = true
        this.$http({
          url: this.$http.adornUrl('/erp/saleorder/outbound/driver/save'),
          method: 'post',
          data: this.$http.adornData(Object.assign({ status: 1 }, this.driverForm))
        }).then(({ data }) => {
          if (data && data.code === 0) {
            const driver = data.driver
            this.driverOptions = [driver].concat(this.driverOptions.filter(item => String(item.id) !== String(driver.id)))
            this.form.driverId = driver.id
            this.quickDriverVisible = false
            this.driverForm = { driverName: '', plateNo: '', mobile: '' }
            this.$message.success('司机新增成功')
          } else {
            this.$message.error((data && data.msg) || '司机新增失败')
          }
        }).finally(() => {
          this.driverSaving = false
        })
      })
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid || this.submitLoading) return
        const selected = this.candidates.filter(item => item._selected && item.ownershipName === this.form.ownershipName)
        if (!selected.length) {
          this.$message.error('请至少选择一条本批次计划货物')
          return
        }
        for (let index = 0; index < selected.length; index++) {
          const row = selected[index]
          if (Number(row.plannedBoxes || 0) <= 0 || Number(row.plannedBoxes) > Number(row.remainingBoxes)) {
            this.$message.error(`第${index + 1}行计划箱数不正确`)
            return
          }
          if (Number(row.plannedWeight || 0) <= 0) {
            this.$message.error(`第${index + 1}行计划重量必须大于0`)
            return
          }
        }
        const payload = {
          saleOrderId: this.saleOrder.id,
          driverId: this.form.driverId,
          ownershipName: this.form.ownershipName,
          planItemList: selected.map(row => ({
            saleOrderItemId: row.id,
            plannedBoxes: Number(row.plannedBoxes),
            plannedWeight: Number(row.plannedWeight)
          }))
        }
        this.submitLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/saleorder/outbound/batch/create'),
          method: 'post',
          data: this.$http.adornData(payload)
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.visible = false
            this.$message.success('出库批次已创建')
            this.$emit('created', data.batch)
          } else {
            this.$message.error((data && data.msg) || '创建出库批次失败')
          }
        }).finally(() => {
          this.submitLoading = false
        })
      })
    }
  }
}
</script>

<style scoped>
.batch-dialog {
  min-height: 470px;
}

.section-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin: 4px 0 10px;
}

.section-title span {
  color: #909399;
  font-size: 12px;
}
</style>
