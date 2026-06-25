<template>
  <el-dialog
    :title="dataForm.id ? '修改销售信息' : '新增销售信息'"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="560px">
    <el-form :model="dataForm" :rules="dataRule" ref="dataForm" label-width="110px">
      <el-form-item label="销售姓名" prop="salesName">
        <el-input v-model.trim="dataForm.salesName" maxlength="100" show-word-limit></el-input>
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model.trim="dataForm.mobile" maxlength="50"></el-input>
      </el-form-item>
      <el-form-item label="绑定登录账号">
        <el-select
          v-model="dataForm.sysUserId"
          filterable
          remote
          clearable
          reserve-keyword
          style="width: 100%;"
          placeholder="输入账号或手机号搜索"
          :loading="userLoading"
          :remote-method="remoteSearchUsers"
          @visible-change="userVisibleChange"
          @change="userChangeHandle">
          <el-option
            v-for="item in userOptions"
            :key="item.userId"
            :label="userLabel(item)"
            :value="item.userId">
            <div>{{ item.username }}</div>
            <div class="option-sub">{{ item.mobile || '-' }}</div>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-switch
          v-model="dataForm.status"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="停用">
        </el-switch>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model.trim="dataForm.remark" type="textarea" maxlength="500" show-word-limit></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button :disabled="submitLoading" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="dataFormSubmit()">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
  const defaultForm = () => ({
    id: 0,
    salesName: '',
    mobile: '',
    sysUserId: '',
    sysUsername: '',
    status: 1,
    remark: ''
  })

  export default {
    data () {
      return {
        visible: false,
        submitLoading: false,
        userLoading: false,
        userOptions: [],
        dataForm: defaultForm(),
        dataRule: {
          salesName: [
            { required: true, message: '销售姓名不能为空', trigger: 'blur' }
          ]
        }
      }
    },
    methods: {
      init (id) {
        this.visible = true
        this.submitLoading = false
        this.userOptions = []
        this.dataForm = defaultForm()
        this.dataForm.id = id || 0
        this.$nextTick(() => {
          this.$refs.dataForm.resetFields()
          if (this.dataForm.id) {
            this.$http({
              url: this.$http.adornUrl(`/erp/salesperson/info/${this.dataForm.id}`),
              method: 'get',
              params: this.$http.adornParams()
            }).then(({ data }) => {
              if (data && data.code === 0) {
                this.dataForm = Object.assign(defaultForm(), data.salesperson || {})
                if (this.dataForm.sysUserId) {
                  this.userOptions = [{
                    userId: this.dataForm.sysUserId,
                    username: this.dataForm.sysUsername,
                    mobile: ''
                  }]
                }
              } else {
                this.$message.error((data && data.msg) || '获取销售信息失败')
              }
            })
          }
        })
      },
      userVisibleChange (visible) {
        if (visible && !this.userOptions.length) {
          this.remoteSearchUsers('')
        }
      },
      remoteSearchUsers (keyword) {
        this.userLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/salesperson/user/select'),
          method: 'get',
          params: this.$http.adornParams({ keyword: keyword || '' })
        }).then(({ data }) => {
          this.userOptions = (data && data.list) || []
        }).finally(() => {
          this.userLoading = false
        })
      },
      userChangeHandle (value) {
        const target = (this.userOptions || []).find(item => item.userId === value)
        this.dataForm.sysUsername = target ? target.username : ''
      },
      userLabel (item) {
        if (!item) return ''
        return item.mobile ? `${item.username} / ${item.mobile}` : item.username
      },
      dataFormSubmit () {
        this.$refs.dataForm.validate((valid) => {
          if (!valid || this.submitLoading) {
            return
          }
          this.submitLoading = true
          this.$http({
            url: this.$http.adornUrl(`/erp/salesperson/${this.dataForm.id ? 'update' : 'save'}`),
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
          }).finally(() => {
            this.submitLoading = false
          })
        })
      }
    }
  }
</script>

<style scoped>
  .option-sub {
    color: #909399;
    font-size: 12px;
    line-height: 18px;
  }
</style>
