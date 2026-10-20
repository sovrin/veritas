<script setup lang="ts">
const password = ref('')
const error = ref('')
const busy = ref(false)
const admin = useAdmin()

async function signIn() {
  error.value = ''
  busy.value = true
  try {
    await $fetch('/api/session', { method: 'POST', body: { password: password.value } })
    admin.value = true
    await navigateTo('/')
  } catch (e) {
    error.value = problem(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="center">
    <form class="card stack gap-4 solo" @submit.prevent="signIn">
      <div class="stack gap-1">
        <p class="brand"><i class="icon" data-icon="layers"></i> veritas</p>
        <p class="text-muted text-s">A very simple headless CMS.</p>
      </div>
      <div class="field">
        <label for="password">Admin password</label>
        <input
          id="password"
          v-model="password"
          class="input"
          type="password"
          autocomplete="current-password"
          required
          autofocus
          :aria-invalid="error ? 'true' : undefined"
          aria-describedby="password-error"
        />
        <span id="password-error" data-error>{{ error }}</span>
      </div>
      <button class="btn" data-variant="primary" type="submit" :aria-busy="busy || undefined">
        <i class="icon" data-icon="log-in"></i> Sign in
      </button>
    </form>
  </main>
</template>
