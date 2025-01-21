useEffect(() => {
  inputRef.current?.focus();
}, []);

useEffect(() => {
  return () => {
    inputRef.current?.blur();
  };
}, []); 