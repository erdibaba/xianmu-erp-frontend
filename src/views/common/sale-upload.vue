<template>
  <div class="buyer-sale-upload">
    <div class="buyer-sale-upload__inner" v-loading="loading">
      <div class="portal-header">
        <div>
          <h2>销售单上传中心</h2>
          <p>请按流程上传盖章合同与二批打款凭证，系统会自动锁定到当前二批商账户。</p>
        </div>
        <div class="portal-header__actions">
          <el-button size="small" @click="goLogin">切换账号</el-button>
          <el-button size="small" type="primary" plain @click="openContract">查看合同</el-button>
        </div>
      </div>

      <el-card shadow="never" class="info-card">
        <div slot="header">销售单信息</div>
        <div class="info-grid">
          <div class="info-item"><span class="label">客户名称</span><span class="value">{{ saleOrder.secondaryPartnerName || '-' }}</span></div>
          <div class="info-item"><span class="label">仓库</span><span class="value">{{ saleOrder.warehouseName || '-' }}</span></div>
          <div class="info-item"><span class="label">销售单号</span><span class="value">{{ saleOrder.orderNo || '-' }}</span></div>
          <div class="info-item"><span class="label">合同号</span><span class="value">{{ saleOrder.contractNo || '-' }}</span></div>
          <div class="info-item"><span class="label">销售类型</span><span class="value">{{ saleTypeLabel }}</span></div>
          <div class="info-item"><span class="label">当前进度</span><span class="value">{{ statusLabel }}</span></div>
        </div>
      </el-card>

      <el-card shadow="never" class="info-card">
        <div slot="header">产品明细</div>
        <el-table class="desktop-table" :data="displayItems" border size="mini">
          <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
          <el-table-column prop="productCode" label="产品编码" min-width="120"></el-table-column>
          <el-table-column prop="productName" label="中文名称" min-width="140"></el-table-column>
          <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column prop="sourceContainerNo" label="柜号" min-width="120"></el-table-column>
          <el-table-column prop="boxes" label="箱数" width="80" align="center"></el-table-column>
        </el-table>
        <div class="mobile-cards">
          <div v-for="(item, index) in displayItems" :key="index" class="mobile-card">
            <div><strong>{{ index + 1 }}. {{ item.productCode || '-' }}</strong></div>
            <div>{{ item.productName || '-' }}</div>
            <div class="mobile-card__en">{{ item.productNameEn || '-' }}</div>
            <div>柜号：{{ item.sourceContainerNo || '-' }}</div>
            <div>箱数：{{ item.boxes || 0 }}</div>
          </div>
        </div>
      </el-card>

      <el-steps :active="stepActive" finish-status="success" align-center class="step-bar">
        <el-step title="盖章合同"></el-step>
        <el-step title="二批打款凭证"></el-step>
        <el-step title="内部上传银行水单"></el-step>
        <el-step title="内部上传资方打款凭证"></el-step>
      </el-steps>

      <div class="step-grid">
        <el-card shadow="never" class="step-card">
          <div slot="header" class="step-card__header">
            <span>第一步：盖章合同</span>
            <el-tag size="small" :type="confirmedTagType(saleOrder.signedContractConfirmed)">{{ confirmedText(saleOrder.signedContractConfirmed) }}</el-tag>
          </div>
          <p class="step-card__tip">下载合同盖章后上传，确认无误后才能进入下一步。</p>
          <div class="step-card__actions">
            <el-button
              v-if="!saleOrder.signedContractConfirmed"
              size="small"
              type="primary"
              plain
              :loading="uploading && currentUploadType === 'SIGNED_CONTRACT'"
              @click="triggerUpload('SIGNED_CONTRACT')">
              上传盖章合同
            </el-button>
            <el-button
              v-if="canConfirmSigned"
              size="small"
              type="success"
              :loading="confirming && currentConfirmType === 'SIGNED_CONTRACT'"
              @click="confirmStep('SIGNED_CONTRACT')">
              确认合同无误
            </el-button>
          </div>
          <el-table :data="signedContractFiles" border size="mini">
            <el-table-column prop="fileName" label="文件名称" min-width="180" show-overflow-tooltip></el-table-column>
            <el-table-column label="上传时间" width="160" align="center">
              <template slot-scope="scope">{{ formatDateTime(scope.row.createTime) }}</template>
            </el-table-column>
            <el-table-column label="下载" width="80" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="downloadPortalFile(scope.row)">下载</el-button>
              </template>
            </el-table-column>
            <el-table-column label="删除" width="80" align="center">
              <template slot-scope="scope">
                <el-button v-if="canDeleteSigned" type="text" size="small" @click="deletePortalFile(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card shadow="never" class="step-card">
          <div slot="header" class="step-card__header">
            <span>第二步：二批打款凭证</span>
            <el-tag size="small" :type="confirmedTagType(saleOrder.buyerPaymentConfirmed)">{{ confirmedText(saleOrder.buyerPaymentConfirmed) }}</el-tag>
          </div>
          <p class="step-card__tip">合同确认后上传银行打款凭证，确认无误后交由内部继续处理。</p>
          <div class="step-card__actions">
            <el-button
              v-if="canUploadBuyerPayment"
              size="small"
              type="primary"
              plain
              :loading="uploading && currentUploadType === 'BUYER_PAYMENT_PROOF'"
              @click="triggerUpload('BUYER_PAYMENT_PROOF')">
              上传二批打款凭证
            </el-button>
            <el-button
              v-if="canConfirmBuyerPayment"
              size="small"
              type="success"
              :loading="confirming && currentConfirmType === 'BUYER_PAYMENT_PROOF'"
              @click="confirmStep('BUYER_PAYMENT_PROOF')">
              确认打款凭证
            </el-button>
          </div>
          <el-table :data="buyerPaymentFiles" border size="mini">
            <el-table-column prop="fileName" label="文件名称" min-width="180" show-overflow-tooltip></el-table-column>
            <el-table-column label="上传时间" width="160" align="center">
              <template slot-scope="scope">{{ formatDateTime(scope.row.createTime) }}</template>
            </el-table-column>
            <el-table-column label="下载" width="80" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="downloadPortalFile(scope.row)">下载</el-button>
              </template>
            </el-table-column>
            <el-table-column label="删除" width="80" align="center">
              <template slot-scope="scope">
                <el-button v-if="canDeleteBuyerPayment" type="text" size="small" @click="deletePortalFile(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card shadow="never" class="step-card step-card--readonly">
          <div slot="header" class="step-card__header">
            <span>第三步：内部上传银行水单</span>
            <el-tag size="small" :type="confirmedTagType(saleOrder.buyerBankConfirmed)">{{ confirmedText(saleOrder.buyerBankConfirmed) }}</el-tag>
          </div>
          <p class="step-card__tip">此步骤由内部人员处理，你可以在这里看到进度。</p>
        </el-card>

        <el-card shadow="never" class="step-card step-card--readonly">
          <div slot="header" class="step-card__header">
            <span>第四步：内部上传资方打款凭证</span>
            <el-tag size="small" :type="confirmedTagType(saleOrder.funderPaymentConfirmed)">{{ confirmedText(saleOrder.funderPaymentConfirmed) }}</el-tag>
          </div>
          <p class="step-card__tip">此步骤由内部人员处理，完成后整条销售流程结束。</p>
        </el-card>
      </div>

      <input ref="uploadInput" type="file" multiple style="display:none;" @change="uploadFileChangeHandle">
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      loading: false,
      uploading: false,
      confirming: false,
      currentUploadType: '',
      currentConfirmType: '',
      saleOrder: {
        itemList: [],
        allocationItemList: [],
        fileList: []
      }
    }
  },
  computed: {
    token () {
      return this.$route.params.token || ''
    },
    displayItems () {
      return this.saleOrder.saleType === 'SPOT'
        ? (this.saleOrder.itemList || [])
        : (this.saleOrder.itemList || [])
    },
    saleTypeLabel () {
      return this.saleOrder.saleType === 'SPOT' ? '现货单' : '期货单'
    },
    statusLabel () {
      const map = {
        1: '待确认盖章合同',
        2: '待确认二批打款凭证',
        3: '待内部确认银行水单',
        4: '待内部确认资方打款凭证',
        5: '流程完成'
      }
      return map[this.saleOrder.status] || '待处理'
    },
    stepActive () {
      const status = Number(this.saleOrder.status || 1)
      return Math.min(status, 4)
    },
    signedContractFiles () {
      return this.getFilesByType('SIGNED_CONTRACT')
    },
    buyerPaymentFiles () {
      return this.getFilesByType('BUYER_PAYMENT_PROOF')
    },
    canConfirmSigned () {
      return !this.saleOrder.signedContractConfirmed && this.signedContractFiles.length > 0
    },
    canDeleteSigned () {
      return Number(this.saleOrder.signedContractConfirmed || 0) === 0
    },
    canUploadBuyerPayment () {
      return Number(this.saleOrder.signedContractConfirmed || 0) === 1 && Number(this.saleOrder.buyerPaymentConfirmed || 0) === 0
    },
    canConfirmBuyerPayment () {
      return Number(this.saleOrder.signedContractConfirmed || 0) === 1 &&
        Number(this.saleOrder.buyerPaymentConfirmed || 0) === 0 &&
        this.buyerPaymentFiles.length > 0
    },
    canDeleteBuyerPayment () {
      return Number(this.saleOrder.buyerPaymentConfirmed || 0) === 0
    }
  },
  created () {
    if (!this.$cookie.get('token')) {
      this.goLogin()
      return
    }
    this.fetchDetail()
  },
  watch: {
    '$route.params.token' () {
      if (this.$cookie.get('token')) {
        this.fetchDetail()
      }
    }
  },
  methods: {
    fetchDetail () {
      this.loading = true
      this.$http({
        url: this.$http.adornUrl(`/erp/saleorder/portal/info/${this.token}`),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.saleOrder = data.saleOrder || { itemList: [], allocationItemList: [], fileList: [] }
        } else {
          this.$message.error((data && data.msg) || '加载失败')
        }
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    getFilesByType (fileType) {
      return (this.saleOrder.fileList || []).filter(item => item.fileType === fileType)
    },
    triggerUpload (fileType) {
      this.currentUploadType = fileType
      this.$refs.uploadInput.value = ''
      this.$refs.uploadInput.click()
    },
    uploadFileChangeHandle (event) {
      const files = Array.from((event.target && event.target.files) || [])
      if (!files.length || !this.currentUploadType) {
        return
      }
      const formData = new FormData()
      formData.append('token', this.token)
      formData.append('fileType', this.currentUploadType)
      files.forEach(file => formData.append('files', file))
      this.uploading = true
      this.$http({
        url: this.$http.adornUrl('/erp/saleorder/portal/upload'),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message.success('上传成功')
          this.fetchDetail()
        } else {
          this.$message.error((data && data.msg) || '上传失败')
        }
        this.uploading = false
      }).catch(() => {
        this.uploading = false
      })
    },
    confirmStep (fileType) {
      this.confirming = true
      this.currentConfirmType = fileType
      this.$http({
        url: this.$http.adornUrl('/erp/saleorder/portal/confirm'),
        method: 'post',
        data: this.$http.adornData({
          token: this.token,
          fileType
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message.success('确认成功')
          this.fetchDetail()
        } else {
          this.$message.error((data && data.msg) || '确认失败')
        }
        this.confirming = false
        this.currentConfirmType = ''
      }).catch(() => {
        this.confirming = false
        this.currentConfirmType = ''
      })
    },
    confirmedText (value) {
      return Number(value || 0) === 1 ? '已确认' : '待确认'
    },
    confirmedTagType (value) {
      return Number(value || 0) === 1 ? 'success' : 'warning'
    },
    openContract () {
      if (!this.saleOrder.contractUrl) {
        this.$message.error('合同链接不存在')
        return
      }
      window.open(this.saleOrder.contractUrl, '_blank')
    },
    downloadPortalFile (row) {
      if (!row || !row.id) {
        return
      }
      this.$http({
        url: this.$http.adornUrl(`/erp/saleorder/portal/download/file/${row.id}`),
        method: 'get',
        responseType: 'blob'
      }).then((response) => {
        const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = row.fileName || 'download'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }).catch(() => {
        this.$message.error('下载失败')
      })
    },
    deletePortalFile (row) {
      if (!row || !row.id) {
        return
      }
      this.$confirm('确认删除这条上传记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$http({
          url: this.$http.adornUrl(`/erp/saleorder/portal/delete/file/${row.id}`),
          method: 'post',
          data: this.$http.adornData({})
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('删除成功')
            this.fetchDetail()
          } else {
            this.$message.error((data && data.msg) || '删除失败')
          }
        })
      }).catch(() => {})
    },
    goLogin () {
      this.$router.replace({ name: 'login', query: { redirect: encodeURIComponent(this.$route.fullPath) } })
    },
    formatDateTime (value) {
      return value ? String(value).slice(0, 19).replace('T', ' ') : ''
    }
  }
}
</script>

<style lang="scss" scoped>
.buyer-sale-upload {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f8ff 0%, #eef2f7 100%);
  padding: 18px;
  box-sizing: border-box;
}

.buyer-sale-upload__inner {
  max-width: 1280px;
  margin: 0 auto;
}

.portal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.portal-header h2 {
  margin: 0 0 8px;
  font-size: 26px;
  color: #0B1457;
}

.portal-header p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.portal-header__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.info-card,
.step-card {
  margin-bottom: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 18px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  color: #909399;
  font-size: 12px;
}

.info-item .value {
  color: #303133;
  font-size: 14px;
  line-height: 1.6;
}

.step-bar {
  margin: 18px 0 22px;
}

.step-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.step-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.step-card__tip {
  margin: 0 0 12px;
  color: #606266;
  line-height: 1.6;
}

.step-card__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.step-card--readonly {
  background: #fafafa;
}

.desktop-table {
  display: block;
}

.mobile-cards {
  display: none;
}

.mobile-card {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 10px;
  background: #fff;
}

.mobile-card__en {
  color: #909399;
  margin: 6px 0;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .portal-header {
    flex-direction: column;
  }

  .info-grid,
  .step-grid {
    grid-template-columns: 1fr;
  }

  .desktop-table {
    display: none;
  }

  .mobile-cards {
    display: block;
  }

  .buyer-sale-upload {
    padding: 12px;
  }
}
</style>
