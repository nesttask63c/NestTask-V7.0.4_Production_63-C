-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'task-attachments');

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-attachments');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'task-attachments' AND owner = auth.uid())
WITH CHECK (bucket_id = 'task-attachments' AND owner = auth.uid());

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task-attachments' AND owner = auth.uid());