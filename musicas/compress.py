from pydub import AudioSegment

sound = AudioSegment.from_file("taylor.wav")
sound = sound.set_frame_rate(16000)

sound.export("out.wav", format="wav")
