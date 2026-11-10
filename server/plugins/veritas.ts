import { registerModule } from '#nexitas/server/utils/nexitas'
import { veritas } from '#self/server/core/module'

export default defineNitroPlugin(() => registerModule(veritas))
