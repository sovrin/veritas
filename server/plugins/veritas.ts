import { registerModule } from '#nexitas/server/utils/nexitas'
import { veritas } from '../core/module'

export default defineNitroPlugin(() => registerModule(veritas))
