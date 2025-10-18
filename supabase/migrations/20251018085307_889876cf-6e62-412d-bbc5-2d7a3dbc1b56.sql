-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_code TEXT NOT NULL UNIQUE,
  course_name TEXT NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_code TEXT NOT NULL UNIQUE,
  subject_name TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  credits INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT NOT NULL UNIQUE,
  building TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invigilators table
CREATE TABLE public.invigilators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam_schedules table
CREATE TABLE public.exam_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  invigilator_id UUID REFERENCES public.invigilators(id) ON DELETE SET NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('Mid-Term', 'Final', 'Practical', 'Other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invigilators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;

-- Create public access policies (for simplicity in this educational system)
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert courses" ON public.courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update courses" ON public.courses FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete courses" ON public.courses FOR DELETE USING (true);

CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Anyone can insert subjects" ON public.subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update subjects" ON public.subjects FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete subjects" ON public.subjects FOR DELETE USING (true);

CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can insert rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON public.rooms FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete rooms" ON public.rooms FOR DELETE USING (true);

CREATE POLICY "Anyone can view invigilators" ON public.invigilators FOR SELECT USING (true);
CREATE POLICY "Anyone can insert invigilators" ON public.invigilators FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update invigilators" ON public.invigilators FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete invigilators" ON public.invigilators FOR DELETE USING (true);

CREATE POLICY "Anyone can view exam_schedules" ON public.exam_schedules FOR SELECT USING (true);
CREATE POLICY "Anyone can insert exam_schedules" ON public.exam_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update exam_schedules" ON public.exam_schedules FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete exam_schedules" ON public.exam_schedules FOR DELETE USING (true);

-- Insert sample data for courses
INSERT INTO public.courses (course_code, course_name, department) VALUES
  ('CS101', 'Computer Science', 'Engineering'),
  ('EC101', 'Electronics & Communication', 'Engineering'),
  ('ME101', 'Mechanical Engineering', 'Engineering'),
  ('EE101', 'Electrical Engineering', 'Engineering');

-- Insert sample data for subjects
INSERT INTO public.subjects (subject_code, subject_name, course_id, semester, credits) VALUES
  ('CS201', 'Data Structures', (SELECT id FROM public.courses WHERE course_code = 'CS101'), 3, 4),
  ('CS301', 'Database Systems', (SELECT id FROM public.courses WHERE course_code = 'CS101'), 5, 4),
  ('CS302', 'Operating Systems', (SELECT id FROM public.courses WHERE course_code = 'CS101'), 5, 3),
  ('EC201', 'Digital Electronics', (SELECT id FROM public.courses WHERE course_code = 'EC101'), 3, 4),
  ('ME201', 'Thermodynamics', (SELECT id FROM public.courses WHERE course_code = 'ME101'), 3, 3);

-- Insert sample data for rooms
INSERT INTO public.rooms (room_number, building, capacity) VALUES
  ('A101', 'Block A', 60),
  ('A102', 'Block A', 50),
  ('B201', 'Block B', 80),
  ('C301', 'Block C', 100),
  ('Lab-1', 'Computer Lab', 30);

-- Insert sample data for invigilators
INSERT INTO public.invigilators (name, email, phone, department) VALUES
  ('Dr. John Smith', 'john.smith@college.edu', '+1-555-0101', 'Computer Science'),
  ('Prof. Sarah Johnson', 'sarah.j@college.edu', '+1-555-0102', 'Electronics'),
  ('Dr. Michael Brown', 'michael.b@college.edu', '+1-555-0103', 'Mechanical'),
  ('Prof. Emily Davis', 'emily.d@college.edu', '+1-555-0104', 'Computer Science');

-- Insert sample exam schedules
INSERT INTO public.exam_schedules (subject_id, exam_date, start_time, end_time, room_id, invigilator_id, exam_type, notes) VALUES
  (
    (SELECT id FROM public.subjects WHERE subject_code = 'CS201'),
    '2025-11-15',
    '09:00',
    '12:00',
    (SELECT id FROM public.rooms WHERE room_number = 'A101'),
    (SELECT id FROM public.invigilators WHERE name = 'Dr. John Smith'),
    'Mid-Term',
    'Bring calculator'
  ),
  (
    (SELECT id FROM public.subjects WHERE subject_code = 'CS301'),
    '2025-11-16',
    '14:00',
    '17:00',
    (SELECT id FROM public.rooms WHERE room_number = 'B201'),
    (SELECT id FROM public.invigilators WHERE name = 'Prof. Emily Davis'),
    'Final',
    NULL
  ),
  (
    (SELECT id FROM public.subjects WHERE subject_code = 'EC201'),
    '2025-11-15',
    '14:00',
    '16:00',
    (SELECT id FROM public.rooms WHERE room_number = 'A102'),
    (SELECT id FROM public.invigilators WHERE name = 'Prof. Sarah Johnson'),
    'Mid-Term',
    NULL
  );

-- Create function to check for time conflicts
CREATE OR REPLACE FUNCTION check_exam_time_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.exam_schedules
    WHERE exam_date = NEW.exam_date
    AND room_id = NEW.room_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      (NEW.start_time >= start_time AND NEW.start_time < end_time)
      OR (NEW.end_time > start_time AND NEW.end_time <= end_time)
      OR (NEW.start_time <= start_time AND NEW.end_time >= end_time)
    )
  ) THEN
    RAISE EXCEPTION 'Time conflict detected: Another exam is scheduled in the same room at overlapping time';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conflict detection
CREATE TRIGGER exam_time_conflict_check
BEFORE INSERT OR UPDATE ON public.exam_schedules
FOR EACH ROW
EXECUTE FUNCTION check_exam_time_conflict();