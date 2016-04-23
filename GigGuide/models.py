from django.db import models

class Gig(models.Model):
	date = models.DateField()
	start = models.TimeField(blank = True)
	end = models.TimeField(blank = True)
	venue = models.CharField(max_length = 100)
	reference = models.CharField(max_length = 100, blank = True, null = True)
	reference_telephone = models.CharField(max_length = 12, blank = True, null = True)
	reference_email = models.EmailField(max_length = 100, blank = True, null = True)
	invoice = models.FloatField(default = 00.00)
	paid = models.BooleanField(default = False)
	cancelled = models.BooleanField(default = False)
	notes = models.TextField(blank = True, null = True)

	def __unicode__(self):
		return " ".join(str(info) for info in [self.date, self.venue, self.start])

	class Meta:
		ordering = ['-date', "-start", "-venue"]