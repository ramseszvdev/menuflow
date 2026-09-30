const Label = ({
	children,
	...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => {
	return <label {...props}>{children}</label>;
};

export { Label };
