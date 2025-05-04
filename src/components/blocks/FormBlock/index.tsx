import * as React from 'react';
import classNames from 'classnames';
import { getComponent } from '../../components-registry';
import { mapStylesToClassNames as mapStyles } from '../../../utils/map-styles-to-class-names';
import SubmitButtonFormControl from './SubmitButtonFormControl';

export default function FormBlock(props) {
    const formRef = React.useRef<HTMLFormElement>(null);
    const [isSubmitted, setIsSubmitted] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');

    const {
        fields = [],
        elementId,
        submitButton,
        className,
        styles = {},
        'data-sb-field-path': fieldPath
    } = props;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formRef.current) return;

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const form = formRef.current;
            const formData = new FormData(form);

            // Create URLSearchParams manually to handle TypeScript typing issues
            const params = new URLSearchParams();
            for (const [key, value] of formData.entries()) {
                // Convert FormDataEntryValue to string
                params.append(key, value.toString());
            }

            const response = await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });

            if (response.ok) {
                setIsSubmitted(true);
                form.reset();
            } else {
                setErrorMessage('There was a problem submitting the form. Please try again.');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            setErrorMessage('There was a problem submitting the form. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (fields.length === 0) {
        return null;
    }

    return (
        <form
            className={classNames(
                'sb-component',
                'sb-component-block',
                'sb-component-form-block',
                className,
                styles?.self?.margin ? mapStyles({ margin: styles?.self?.margin }) : undefined,
                styles?.self?.padding ? mapStyles({ padding: styles?.self?.padding }) : undefined,
                styles?.self?.borderWidth && styles?.self?.borderWidth !== 0 && styles?.self?.borderStyle !== 'none'
                    ? mapStyles({
                        borderWidth: styles?.self?.borderWidth,
                        borderStyle: styles?.self?.borderStyle,
                        borderColor: styles?.self?.borderColor ?? 'border-primary'
                    })
                    : undefined,
                styles?.self?.borderRadius ? mapStyles({ borderRadius: styles?.self?.borderRadius }) : undefined
            )}
            name={elementId}
            id={elementId}
            ref={formRef}
            data-sb-field-path={fieldPath}
            method="POST"
            data-netlify="true"
            netlify-honeypot="bot-field"
            onSubmit={handleSubmit}
        >
            {/* These hidden fields are required for Netlify form detection */}
            <input type="hidden" name="form-name" value={elementId} />
            <p hidden>
                <label>
                    Don't fill this out if you're human: <input name="bot-field" />
                </label>
            </p>

            <div
                className={classNames(
                    'w-full',
                    'flex',
                    'flex-wrap',
                    'gap-8',
                    mapStyles({ justifyContent: styles?.self?.justifyContent ?? 'flex-start' })
                )}
                {...(fieldPath && { 'data-sb-field-path': '.fields' })}
            >
                {fields.map((field, index) => {
                    const modelName = field.__metadata.modelName;
                    if (!modelName) {
                        throw new Error(`form field does not have the 'modelName' property`);
                    }
                    const FormControl = getComponent(modelName);
                    if (!FormControl) {
                        throw new Error(`no component matching the form field model name: ${modelName}`);
                    }
                    return <FormControl
                        key={index}
                        {...field}
                        {...(fieldPath && { 'data-sb-field-path': `.${index}` })}
                    />;
                })}
            </div>

            {submitButton && (
                <div className={classNames(
                    'mt-8',
                    'flex',
                    'flex-col',
                    'items-center',
                    mapStyles({ justifyContent: styles?.self?.justifyContent ?? 'flex-start' })
                )}>
                    <SubmitButtonFormControl
                        {...submitButton}
                        disabled={isSubmitting}
                        {...(fieldPath && { 'data-sb-field-path': '.submitButton' })}
                    />

                    {isSubmitting && (
                        <p className="mt-4 text-gray-600 text-center">
                            Submitting...
                        </p>
                    )}

                    {isSubmitted && (
                        <p className="mt-4 text-green-600 text-center">
                            Thank you! Your message has been sent.
                        </p>
                    )}

                    {errorMessage && (
                        <p className="mt-4 text-red-600 text-center">
                            {errorMessage}
                        </p>
                    )}
                </div>
            )}
        </form>
    );
}