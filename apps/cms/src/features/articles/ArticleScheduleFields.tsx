import { Button } from '@coastal-talk-news/ui/button';
import { DateTimeField } from '@coastal-talk-news/ui/date-time-field';
import { Field } from '@coastal-talk-news/ui/field';
import { splitIso } from '../../lib/dateTime.js';
import type { FormValues, UpdateValues } from './formValues.js';

interface ArticleScheduleFieldsProps {
  values: FormValues;
  onChange: UpdateValues;
  error?: string;
}

/** The optional end of an article's time on the website. */
export function ArticleScheduleFields({
  values,
  onChange,
  error,
}: ArticleScheduleFieldsProps) {
  const hasEnd = values.endDate !== '' || values.endTime !== '';

  return (
    <section className="border-hairline rounded-card space-y-3 border bg-surface p-5 shadow-sm">
      <div>
        <h2 className="text-ink text-base font-semibold">
          Scheduling{' '}
          <span className="text-ink-subtle font-normal">(Optional)</span>
        </h2>
        <p className="text-ink-muted mt-0.5 text-sm">
          Choose when this article comes off the website. Left empty, it stays
          until you archive or delete it.
        </p>
      </div>

      <Field label="End Date & Time" htmlFor="article-end-date" error={error}>
        <DateTimeField
          id="article-end-date"
          date={values.endDate}
          time={values.endTime}
          minDate={splitIso(new Date().toISOString()).date}
          invalid={Boolean(error)}
          dateLabel="End date"
          timeLabel="End time"
          onDateChange={(endDate) => onChange({ endDate })}
          onTimeChange={(endTime) => onChange({ endTime })}
        />
      </Field>

      {hasEnd && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange({ endDate: '', endTime: '' })}
        >
          Remove end date
        </Button>
      )}
    </section>
  );
}
