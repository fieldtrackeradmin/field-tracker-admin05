import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://ouxnefjbtkmwegiyqbim.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91eG5lZmpidGttd2VnaXlxYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Njg3MzEsImV4cCI6MjA4ODE0NDczMX0.kEk7oLpRpXY84mi30qzz13AcZBwv9L-pWkNxmfHfyhs"
);

