// Verbinde dein Frontend direkt mit Supabase
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const SUPABASE_URL = 'https://iogtomofmqatheuratev.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZ3RvbW9mbXFhdGhldXJhdGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDMwODQsImV4cCI6MjA3NjcxOTA4NH0.f-aJLQWOcQ_sO0_vc3h8W4Xd3d8potCIFe_pumqM6tU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
