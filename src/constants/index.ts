import {
  Home,
  User,
  GitBranch,
  Network,
  Workflow,
  Database,
  Users,
  ShoppingCart,
  FolderOpen,
  BookOpen,
  CassetteTape
} from 'lucide-react'
import type { EngineType } from '@/types'

export const ENGINES: { value: EngineType; label: string }[] = [
  { value: 'mermaid', label: 'Mermaid' },
  { value: 'excalidraw', label: 'Excalidraw' },
  { value: 'drawio', label: 'Draw.io' },
  { value: 'plantuml', label: 'PlantUML' },
]

export const NAV_ITEMS = [
  { icon: Home, label: '首页', path: '/' },
  { icon: FolderOpen, label: '项目管理', path: '/projects' },
  { icon: User, label: '用户信息', path: '/profile' },
]

export const QUICK_ACTIONS = [
  {
    label: '用 PlantUML 绘制时序图',
    icon: BookOpen,
    engine: 'plantuml' as EngineType,
    prompt: '请帮我用 PlantUML 绘制一个用户登录的时序图，包含浏览器、服务器、数据库之间的请求与响应流程'
  },
  {
    label: '用 Mermaid 绘制用户登录流程图',
    icon: Workflow,
    engine: 'mermaid' as EngineType,
    prompt: '请帮我用 Mermaid 绘制一个用户登录流程图，包含输入账号密码、验证、登录成功/失败等步骤'
  },
  {
    label: '用 Excalidraw 绘制微服务架构图',
    icon: Network,
    engine: 'excalidraw' as EngineType,
    prompt: '请帮我用 Excalidraw 绘制一个微服务架构图，包含 API 网关、多个服务、服务注册中心、配置中心等'
  },
  {
    label: '用 DrawIO 绘制组织架构图',
    icon: Users,
    engine: 'drawio' as EngineType,
    prompt: '请帮我用 DrawIO 绘制一个公司组织架构图，包含 CEO、各部门经理、团队成员的层级关系'
  },
]
