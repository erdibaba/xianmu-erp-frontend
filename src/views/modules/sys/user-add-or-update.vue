<template>
  <el-dialog
    :title="!dataForm.id ? '新增用户' : '修改用户'"
    :close-on-click-modal="false"
    :visible.sync="visible">
    <el-form :model="dataForm" :rules="dataRule" ref="dataForm" @keyup.enter.native="dataFormSubmit()" label-width="100px">
      <el-form-item label="用户名" prop="userName">
        <el-input v-model="dataForm.userName" placeholder="登录账号"></el-input>
      </el-form-item>
      <el-form-item label="密码" prop="password" :class="{ 'is-required': !dataForm.id }">
        <el-input v-model="dataForm.password" type="password" placeholder="密码"></el-input>
      </el-form-item>
      <el-form-item label="确认密码" prop="comfirmPassword" :class="{ 'is-required': !dataForm.id }">
        <el-input v-model="dataForm.comfirmPassword" type="password" placeholder="确认密码"></el-input>
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="dataForm.email" placeholder="邮箱"></el-input>
      </el-form-item>
      <el-form-item label="手机号" prop="mobile">
        <el-input v-model="dataForm.mobile" placeholder="手机号"></el-input>
      </el-form-item>
      <el-form-item label="绑定二批主体" prop="secondaryPartnerId">
        <el-select
          v-model="dataForm.secondaryPartnerId"
          filterable
          clearable
          style="width:100%;"
          placeholder="可选，绑定后该账号仅用于对应二批商上传">
          <el-option
            v-for="item in secondaryPartnerList"
            :key="item.id"
            :label="item.partnerName"
            :value="item.id">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="角色" size="mini" prop="roleIdList">
        <el-checkbox-group v-model="dataForm.roleIdList">
          <el-checkbox v-for="role in roleList" :key="role.roleId" :label="role.roleId">{{ role.roleName }}</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="库存温区权限" size="mini" prop="inventoryTemperatureScopes">
        <el-checkbox-group v-model="dataForm.inventoryTemperatureScopes">
          <el-checkbox label="CHILLED">冷藏（含冷鲜）</el-checkbox>
          <el-checkbox label="FROZEN">冷冻</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="状态" size="mini" prop="status">
        <el-radio-group v-model="dataForm.status">
          <el-radio :label="0">禁用</el-radio>
          <el-radio :label="1">正常</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="dataFormSubmit()">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { isEmail, isMobile } from '@/utils/validate'

export default {
  data () {
    var validatePassword = (rule, value, callback) => {
      if (!this.dataForm.id && !/\S/.test(value)) {
        callback(new Error('密码不能为空'))
      } else {
        callback()
      }
    }
    var validateComfirmPassword = (rule, value, callback) => {
      if (!this.dataForm.id && !/\S/.test(value)) {
        callback(new Error('确认密码不能为空'))
      } else if (this.dataForm.password !== value) {
        callback(new Error('确认密码与密码输入不一致'))
      } else {
        callback()
      }
    }
    var validateEmail = (rule, value, callback) => {
      if (!isEmail(value)) {
        callback(new Error('邮箱格式错误'))
      } else {
        callback()
      }
    }
    var validateMobile = (rule, value, callback) => {
      if (!isMobile(value)) {
        callback(new Error('手机号格式错误'))
      } else {
        callback()
      }
    }
    return {
      visible: false,
      roleList: [],
      secondaryPartnerList: [],
      dataForm: {
        id: 0,
        userName: '',
        password: '',
        comfirmPassword: '',
        salt: '',
        email: '',
        mobile: '',
        secondaryPartnerId: '',
        inventoryTemperatureScopes: ['CHILLED', 'FROZEN'],
        roleIdList: [],
        status: 1
      },
      dataRule: {
        userName: [
          { required: true, message: '用户名不能为空', trigger: 'blur' }
        ],
        password: [
          { validator: validatePassword, trigger: 'blur' }
        ],
        comfirmPassword: [
          { validator: validateComfirmPassword, trigger: 'blur' }
        ],
        email: [
          { required: true, message: '邮箱不能为空', trigger: 'blur' },
          { validator: validateEmail, trigger: 'blur' }
        ],
        mobile: [
          { required: true, message: '手机号不能为空', trigger: 'blur' },
          { validator: validateMobile, trigger: 'blur' }
        ],
        inventoryTemperatureScopes: [
          { type: 'array', required: true, min: 1, message: '请至少选择一个库存温区权限', trigger: 'change' }
        ]
      }
    }
  },
  methods: {
    init (id) {
      this.dataForm.id = id || 0
      const loading = this.$loading({ lock: true, text: '正在加载管理员维护数据...' })
      Promise.all([this.loadRoles(), this.loadSecondaryPartners()]).then(() => {
        this.visible = true
        this.$nextTick(() => {
          this.$refs['dataForm'].resetFields()
        })
      }).then(() => {
        if (this.dataForm.id) {
          this.$http({
            url: this.$http.adornUrl(`/sys/user/info/${this.dataForm.id}`),
            method: 'get',
            params: this.$http.adornParams()
          }).then(({ data }) => {
            if (data && data.code === 0) {
              this.dataForm.userName = data.user.username
              this.dataForm.salt = data.user.salt
              this.dataForm.email = data.user.email
              this.dataForm.mobile = data.user.mobile
              this.dataForm.secondaryPartnerId = data.user.secondaryPartnerId || ''
              this.dataForm.inventoryTemperatureScopes = String(data.user.inventoryTemperatureScope || 'CHILLED,FROZEN')
                .split(',').filter(item => item === 'CHILLED' || item === 'FROZEN')
              this.dataForm.roleIdList = data.user.roleIdList
              this.dataForm.status = data.user.status
            } else {
              this.$message.error((data && data.msg) || '获取管理员信息失败')
            }
          }).catch(() => {
            this.$message.error('获取管理员信息请求失败，请检查登录状态或后端服务')
          })
        }
      }).catch((error) => {
        this.$message.error((error && error.message) || '加载管理员维护数据失败，请检查登录状态、权限或后端服务')
      }).finally(() => {
        loading.close()
      })
    },
    loadRoles () {
      return this.$http({
        url: this.$http.adornUrl('/sys/role/select'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.roleList = data.list || []
          return
        }
        throw new Error((data && data.msg) || '获取角色列表失败')
      })
    },
    loadSecondaryPartners () {
      return this.$http({
        url: this.$http.adornUrl('/erp/partner/select'),
        method: 'get',
        params: this.$http.adornParams({ businessRole: 'SECONDARY' })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.secondaryPartnerList = data.list || []
          return
        }
        throw new Error((data && data.msg) || '获取二批主体列表失败')
      })
    },
    dataFormSubmit () {
      this.$refs['dataForm'].validate((valid) => {
        if (!valid) {
          return false
        }
        const partner = this.secondaryPartnerList.find(item => String(item.id) === String(this.dataForm.secondaryPartnerId))
        this.$http({
          url: this.$http.adornUrl(`/sys/user/${!this.dataForm.id ? 'save' : 'update'}`),
          method: 'post',
          data: this.$http.adornData({
            userId: this.dataForm.id || undefined,
            username: this.dataForm.userName,
            password: this.dataForm.password,
            salt: this.dataForm.salt,
            email: this.dataForm.email,
            mobile: this.dataForm.mobile,
            secondaryPartnerId: this.dataForm.secondaryPartnerId || undefined,
            secondaryPartnerName: partner ? partner.partnerName : '',
            inventoryTemperatureScope: this.dataForm.inventoryTemperatureScopes.join(','),
            status: this.dataForm.status,
            roleIdList: this.dataForm.roleIdList
          })
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
            this.$message.error(data.msg)
          }
        })
      })
    }
  }
}
</script>
