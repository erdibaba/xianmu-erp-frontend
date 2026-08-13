<template>
  <el-dialog
    :title="dataForm.id ? '修改往来单位' : '新增往来单位'"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="760px">
    <el-form :model="dataForm" :rules="dataRule" ref="dataForm" label-width="110px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="单位编码" prop="partnerCode">
            <el-input v-model="dataForm.partnerCode" placeholder="请输入单位编码"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="单位名称" prop="partnerName">
            <el-input v-model="dataForm.partnerName" placeholder="请输入单位名称"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态">
            <el-switch v-model="dataForm.status" :active-value="1" :inactive-value="0"></el-switch>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否内部主体">
            <el-switch v-model="dataForm.internalEntityFlag" :active-value="1" :inactive-value="0"></el-switch>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="业务角色">
            <el-checkbox-group v-model="dataForm.businessRoles">
              <el-checkbox
                v-for="item in bizRoleOptions"
                :key="item.value"
                :label="item.value">
                {{ item.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="风险标记">
            <el-select v-model="dataForm.riskLevel" placeholder="请选择风险标记" style="width: 100%;">
              <el-option label="正常" value="NORMAL"></el-option>
              <el-option label="关注" value="WATCH"></el-option>
              <el-option label="违约" value="DEFAULTED"></el-option>
              <el-option label="黑名单" value="BLACKLIST"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="dataForm.riskLevel !== 'NORMAL'">
          <el-form-item label="风险标记日期">
            <el-date-picker v-model="dataForm.riskMarkDate" type="date" value-format="yyyy-MM-dd" style="width: 100%;"></el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="24" v-if="dataForm.riskLevel !== 'NORMAL'">
          <el-form-item label="风险说明">
            <el-input v-model="dataForm.riskRemark" type="textarea" :rows="2" maxlength="500" show-word-limit></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="冷库减免天数">
            <el-input-number
              v-model="dataForm.coldStorageFreeDays"
              :min="1"
              :precision="0"
              :controls="false"
              style="width: 100%;"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="showAnnualInterestRate">
          <el-form-item label="年利率（%）">
            <el-input-number
              v-model="dataForm.annualInterestRate"
              :min="0"
              :precision="10"
              :controls="false"
              placeholder="请输入年利率"
              style="width: 100%;"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="24" v-if="showSecondaryFields">
          <div class="rate-rule-header">
            <span>二批阶梯年化规则</span>
            <el-button type="text" @click="addInterestRateRule">新增规则</el-button>
          </div>
          <el-table :data="dataForm.interestRateList" border size="mini" class="rate-rule-table">
            <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
            <el-table-column label="起始天数" width="120">
              <template slot-scope="scope">
                <el-input-number v-model="scope.row.startDay" :min="1" :precision="0" :controls="false" size="mini"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column label="结束天数" width="120">
              <template slot-scope="scope">
                <el-input-number v-model="scope.row.endDay" :min="1" :precision="0" :controls="false" size="mini" placeholder="空=以后"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column label="年化(%)" width="130">
              <template slot-scope="scope">
                <el-input-number v-model="scope.row.annualRate" :min="0" :precision="4" :controls="false" size="mini"></el-input-number>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="180">
              <template slot-scope="scope">
                <el-input v-model="scope.row.remark" size="mini" maxlength="500"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template slot-scope="scope">
                <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0"></el-switch>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="mini" @click="removeInterestRateRule(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="rate-rule-tip">自然天从检疫证日期当天算第1天；系统会先扣除冷库减免天数，再按命中的自然天阶梯分段计息。</div>
        </el-col>
        <el-col :span="12" v-if="showFunderFields">
          <el-form-item label="资方账期天数">
            <el-input-number
              v-model="dataForm.funderCreditDays"
              :min="0"
              :precision="0"
              :controls="false"
              placeholder="请输入资方账期天数"
              style="width: 100%;"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="showFunderFields">
          <el-form-item label="账期预警天数">
            <el-input-number
              v-model="dataForm.funderWarningDays"
              :min="0"
              :precision="0"
              :controls="false"
              placeholder="一般设置14天"
              style="width: 100%;"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="税号">
            <el-input v-model="dataForm.taxNo"></el-input>
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
          <el-form-item label="企微客户群">
            <el-select
              v-model="dataForm.wecomChatId"
              filterable
              clearable
              placeholder="请选择企微客户群"
              style="width: 100%;"
              @visible-change="loadWecomGroups"
              @change="wecomGroupChange">
              <el-option
                v-for="item in wecomGroupList"
                :key="item.chatId"
                :label="item.groupName || item.chatId"
                :value="item.chatId">
                <div>{{ item.groupName || '未命名客户群' }}</div>
                <div style="font-size: 12px; color: #909399;">{{ item.owner || '-' }} / {{ item.chatId }}</div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="企微群主">
            <el-input v-model="dataForm.wecomChatOwner" disabled></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系邮箱">
            <el-input v-model="dataForm.contactEmail"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开户行">
            <el-input v-model="dataForm.bankName"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="银行账号">
            <el-input v-model="dataForm.bankAccount"></el-input>
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
import { PARTNER_BIZ_ROLE_OPTIONS } from './const'

const defaultForm = () => ({
  id: 0,
  partnerCode: '',
  partnerName: '',
  businessRole: '',
  businessRoles: [],
  internalEntityFlag: 0,
  coldStorageFreeDays: 7,
  annualInterestRate: null,
  funderCreditDays: null,
  funderWarningDays: 14,
  taxNo: '',
  bankName: '',
  bankAccount: '',
  address: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  wecomChatId: '',
  wecomChatName: '',
  wecomChatOwner: '',
  riskLevel: 'NORMAL',
  riskRemark: '',
  riskMarkDate: '',
  interestRateList: [
    { startDay: 8, endDay: 30, annualRate: 9.6, remark: '默认：第8-30天（含30天）按9.6%', status: 1 },
    { startDay: 31, endDay: null, annualRate: 18, remark: '默认：第31天起按18%', status: 1 }
  ],
  remark: '',
  status: 1
})

export default {
  data () {
    return {
      visible: false,
      bizRoleOptions: PARTNER_BIZ_ROLE_OPTIONS,
      wecomGroupList: [],
      dataForm: defaultForm(),
      dataRule: {
        partnerCode: [
          { required: true, message: '单位编码不能为空', trigger: 'blur' }
        ],
        partnerName: [
          { required: true, message: '单位名称不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    showAnnualInterestRate () {
      return (this.dataForm.businessRoles || []).some(role => role === 'FUNDER' || role === 'SECONDARY')
    },
    showSecondaryFields () {
      return (this.dataForm.businessRoles || []).some(role => role === 'SECONDARY')
    },
    showFunderFields () {
      return (this.dataForm.businessRoles || []).some(role => role === 'FUNDER')
    }
  },
  methods: {
    init (id) {
      this.visible = true
      this.dataForm = defaultForm()
      this.dataForm.id = id || 0
      this.loadWecomGroups()
      this.$nextTick(() => {
        this.$refs.dataForm.resetFields()
        if (this.dataForm.id) {
          this.$http({
            url: this.$http.adornUrl(`/erp/partner/info/${this.dataForm.id}`),
            method: 'get',
            params: this.$http.adornParams()
          }).then(({ data }) => {
            if (data && data.code === 0) {
              this.dataForm = Object.assign(defaultForm(), data.partner || {})
              this.dataForm.businessRoles = this.dataForm.businessRole ? this.dataForm.businessRole.split(',') : []
              this.dataForm.internalEntityFlag = Number(this.dataForm.internalEntityFlag || 0) === 1 ? 1 : 0
              this.dataForm.coldStorageFreeDays = this.dataForm.coldStorageFreeDays || 7
              if (!this.dataForm.interestRateList || !this.dataForm.interestRateList.length) {
                this.dataForm.interestRateList = defaultForm().interestRateList
              }
            } else {
              this.$message.error(data.msg || '获取往来单位失败')
            }
          })
        }
      })
    },
    loadWecomGroups () {
      this.$http({
        url: this.$http.adornUrl('/erp/wecom/groups/select'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        this.wecomGroupList = (data && data.list) || []
      })
    },
    wecomGroupChange (chatId) {
      const group = this.wecomGroupList.find(item => item.chatId === chatId)
      this.dataForm.wecomChatName = group ? group.groupName : ''
      this.dataForm.wecomChatOwner = group ? group.owner : ''
    },
    addInterestRateRule () {
      if (!this.dataForm.interestRateList) {
        this.$set(this.dataForm, 'interestRateList', [])
      }
      this.dataForm.interestRateList.push({
        startDay: 1,
        endDay: null,
        annualRate: 0,
        remark: '',
        status: 1
      })
    },
    removeInterestRateRule (index) {
      this.dataForm.interestRateList.splice(index, 1)
    },
    dataFormSubmit () {
      this.$refs.dataForm.validate((valid) => {
        if (!valid) {
          return
        }
        const payload = Object.assign({}, this.dataForm, {
          businessRole: (this.dataForm.businessRoles || []).join(','),
          coldStorageFreeDays: this.dataForm.coldStorageFreeDays || 7,
          interestRateList: this.showSecondaryFields ? (this.dataForm.interestRateList || []) : []
        })
        delete payload.partnerType
        this.$http({
          url: this.$http.adornUrl(`/erp/partner/${!this.dataForm.id ? 'save' : 'update'}`),
          method: 'post',
          data: this.$http.adornData(payload)
        }).then(({ data }) => {
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

<style scoped>
.rate-rule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0 8px 110px;
  font-weight: 600;
}

.rate-rule-table {
  margin-left: 110px;
  width: calc(100% - 110px);
}

.rate-rule-table .el-input-number {
  width: 100%;
}

.rate-rule-tip {
  margin: 6px 0 14px 110px;
  color: #909399;
  font-size: 12px;
}
</style>
